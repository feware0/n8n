import { BasePage } from './BasePage';

export class BecomeCreatorCTAPage extends BasePage {
	// Element getters (no async, return Locator)
	getBecomeTemplateCreatorCta() {
		return this.page.getByTestId('become-template-creator-cta');
	}

	getCloseBecomeTemplateCreatorCtaButton() {
		return this.page.getByTestId('close-become-template-creator-cta');
	}

	// Simple actions (async, return void)
	async closeBecomeTemplateCreatorCta() {
		await this.getCloseBecomeTemplateCreatorCtaButton().click();
	}

	// API interception helper
	async interceptCtaRequestWithResponse(becomeCreator: boolean) {
		await this.page.route('**/rest/cta/become-creator', (route) => {
			void route.fulfill({
				status: 200,
				body: JSON.stringify(becomeCreator),
			});
		});
	}
}
