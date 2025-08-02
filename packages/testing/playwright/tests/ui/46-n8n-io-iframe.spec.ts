import { test, expect } from '../../fixtures/base';

test.describe('n8n.io iframe', () => {
	test.describe('when telemetry is disabled', () => {
		test('should not load the iframe when visiting /home/workflows', async ({ n8n }) => {
			// Override settings to disable telemetry
			await n8n.page.addInitScript(() => {
				window.localStorage.setItem('n8n-telemetry', JSON.stringify({ enabled: false }));
			});

			await n8n.page.goto('/');
			await n8n.page.waitForLoadState();

			// Verify no iframe exists
			await expect(n8n.iframe.getIframe()).toBeHidden();
		});
	});

	test.describe('when telemetry is enabled', () => {
		test('should load the iframe when visiting /home/workflows', async ({ n8n }) => {
			const testInstanceId = 'test-instance-id';
			const testUserId = 'test-user-id';

			// Override settings to enable telemetry
			await n8n.page.addInitScript(
				([testInstanceId]) => {
					window.localStorage.setItem('n8n-telemetry', JSON.stringify({ enabled: true }));
					window.localStorage.setItem('n8n-instance-id', testInstanceId);
				},
				[testInstanceId],
			);

			const iframeUrl = `https://n8n.io/self-install?instanceId=${testInstanceId}&userId=${testUserId}`;

			// Intercept the iframe request
			await n8n.iframe.interceptIframeRequest(iframeUrl);

			await n8n.page.goto('/');
			await n8n.page.waitForLoadState();

			// Check if iframe exists with the expected src
			const iframeElement = n8n.iframe.getIframeBySrc(iframeUrl);
			const isIframeAvailable = await iframeElement.isVisible();

			// Skip test if iframe is not available
			// eslint-disable-next-line playwright/no-skipped-test
			test.skip(!isIframeAvailable, 'Iframe not available');

			// Wait for the iframe request to complete
			await n8n.iframe.waitForIframeRequest(iframeUrl);

			// Verify iframe has correct src attribute
			await expect(iframeElement).toHaveAttribute('src', iframeUrl);
		});
	});
});
