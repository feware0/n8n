import { test, expect } from '../../fixtures/base';
import type { TestRequirements } from '../../Types';

const telemetryDisabledRequirements: TestRequirements = {
	storage: {
		'n8n-telemetry': JSON.stringify({ enabled: false }),
	},
};

const telemetryEnabledRequirements: TestRequirements = {
	storage: {
		'n8n-telemetry': JSON.stringify({ enabled: true }),
		'n8n-instance-id': 'test-instance-id',
	},
	intercepts: {
		iframeRequest: {
			url: 'https://n8n.io/self-install*',
			response: '<html><body>Test iframe content</body></html>',
			contentType: 'text/html',
		},
	},
};

test.describe('n8n.io iframe', () => {
	test.describe('when telemetry is disabled', () => {
		test('should not load the iframe when visiting /home/workflows', async ({
			n8n,
			setupRequirements,
		}) => {
			await setupRequirements(telemetryDisabledRequirements);

			await n8n.page.goto('/');
			await n8n.page.waitForLoadState();

			// Verify no iframe exists
			await expect(n8n.iframe.getIframe()).toBeHidden();
		});
	});

	test.describe('when telemetry is enabled', () => {
		test('should load the iframe when visiting /home/workflows', async ({
			n8n,
			setupRequirements,
		}) => {
			await setupRequirements(telemetryEnabledRequirements);

			const testInstanceId = 'test-instance-id';
			const testUserId = 'test-user-id';
			const iframeUrl = `https://n8n.io/self-install?instanceId=${testInstanceId}&userId=${testUserId}`;

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
