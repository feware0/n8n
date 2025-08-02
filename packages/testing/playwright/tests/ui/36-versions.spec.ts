import { test, expect } from '../../fixtures/base';

test.describe('Versions', () => {
	test('should open updates panel when version updates are available', async ({ n8n }) => {
		await n8n.page.goto('/');
		await n8n.page.waitForLoadState();

		// Check if version update elements are available
		const versionUpdateButton = n8n.versions.getVersionUpdatesPanelOpenButton();
		const isVersionUpdatesAvailable = await versionUpdateButton.isVisible();

		// Skip test if version updates are not available
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(!isVersionUpdatesAvailable, 'Version updates not available');

		// Open the version updates panel
		await n8n.versions.openVersionUpdatesPanel();

		// Check that the panel is visible
		await expect(n8n.versions.getVersionUpdatesPanel()).toBeVisible();

		// Check that version cards are present (at least one)
		await expect(n8n.versions.getVersionCard()).toHaveCount(1);

		// Close the version updates panel
		await n8n.versions.closeVersionUpdatesPanel();

		// Verify the panel is closed
		await expect(n8n.versions.getVersionUpdatesPanel()).toBeHidden();
	});
});
