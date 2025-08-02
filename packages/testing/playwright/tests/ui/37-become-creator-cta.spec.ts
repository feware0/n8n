import { test, expect } from '../../fixtures/base';

test.describe('Become creator CTA', () => {
	test('should not show the CTA if user is not eligible', async ({ n8n }) => {
		await n8n.becomeCreatorCTA.interceptCtaRequestWithResponse(false);
		await n8n.page.goto('/');
		await n8n.page.waitForLoadState();

		// Wait for the API call to complete
		await n8n.page.waitForResponse('**/rest/cta/become-creator');

		// Verify the CTA is not visible
		await expect(n8n.becomeCreatorCTA.getBecomeTemplateCreatorCta()).toBeHidden();
	});

	test('should show the CTA if the user is eligible', async ({ n8n }) => {
		await n8n.becomeCreatorCTA.interceptCtaRequestWithResponse(true);
		await n8n.page.goto('/');
		await n8n.page.waitForLoadState();

		// Wait for the API call to complete
		await n8n.page.waitForResponse('**/rest/cta/become-creator');

		// Check if CTA is available and visible
		const ctaElement = n8n.becomeCreatorCTA.getBecomeTemplateCreatorCta();
		const isCTAAvailable = await ctaElement.isVisible();

		// Skip test if CTA is not available
		// eslint-disable-next-line playwright/no-skipped-test
		test.skip(!isCTAAvailable, 'CTA not available');

		// Close the CTA
		await n8n.becomeCreatorCTA.closeBecomeTemplateCreatorCta();

		// Verify the CTA is no longer visible
		await expect(n8n.becomeCreatorCTA.getBecomeTemplateCreatorCta()).toBeHidden();
	});
});
