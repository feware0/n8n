import type { Page, BrowserContext } from '@playwright/test';

import { n8nPage } from '../pages/n8nPage';
import { ApiHelpers } from '../services/api-helper';
import { TestError, type TestRequirements } from '../Types';

/**
 * Setup test requirements including feature flags, API intercepts, browser storage, and workflows.
 *
 * @param page - Playwright page instance
 * @param context - Playwright browser context
 * @param requirements - TestRequirements configuration object
 *
 * @example
 * ```typescript
 * import { setupTestRequirements } from '../utils/requirements';
 *
 * const requirements: TestRequirements = {
 *   workflow: { 'test.json': 'Test Workflow' }
 * };
 *
 * test('my test', async ({ page, context }) => {
 *   await setupTestRequirements(page, context, requirements);
 *   // Test starts on canvas with workflow imported
 * });
 * ```
 */
export async function setupTestRequirements(
	page: Page,
	context: BrowserContext,
	requirements: TestRequirements,
): Promise<void> {
	const n8n = new n8nPage(page);
	const api = new ApiHelpers(context.request);

	// 1. Setup feature flags
	if (requirements.config?.features) {
		for (const [feature, enabled] of Object.entries(requirements.config.features)) {
			if (enabled) {
				await api.enableFeature(feature);
			} else {
				await api.disableFeature(feature);
			}
		}
	}

	// 2. Setup API intercepts
	if (requirements.intercepts) {
		for (const [, config] of Object.entries(requirements.intercepts)) {
			await page.route(config.url, async (route) => {
				if (config.forceNetworkError) {
					await route.abort('failed');
					return;
				}

				await route.fulfill({
					status: config.status ?? 200,
					headers: config.headers,
					contentType: config.contentType ?? 'application/json',
					body: JSON.stringify(config.response),
				});
			});
		}
	}

	// 3. Setup browser storage
	if (requirements.storage) {
		await page.addInitScript((storage) => {
			for (const [key, value] of Object.entries(storage)) {
				window.localStorage.setItem(key, value);
			}
		}, requirements.storage);
	}

	// 4. Import single workflow and navigate to canvas
	if (requirements.workflow) {
		const workflowEntries = Object.entries(requirements.workflow);

		if (workflowEntries.length > 1) {
			throw new TestError(
				'TestRequirements only supports a single workflow. Multiple workflows are not allowed.',
			);
		}

		// Single workflow - import and stay on canvas
		const [fileName, workflowName] = workflowEntries[0];
		await n8n.goHome();
		await n8n.workflows.clickAddWorkflowButton();
		await n8n.canvas.importWorkflow(fileName, workflowName);
		// Test starts on canvas after import (as per TestRequirements documentation)
	}
}
