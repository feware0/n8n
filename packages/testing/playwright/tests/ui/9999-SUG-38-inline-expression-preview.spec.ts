import { test, expect } from '../../fixtures/base';

test.describe('SUG-38 Inline expression previews are not displayed in NDV', () => {
	test("should show resolved inline expression preview in NDV if the node's input data is populated", async ({
		n8n,
	}) => {
		// Start from home page and create new workflow
		await n8n.goHome();
		await n8n.workflows.clickAddWorkflowButton();

		// Import the workflow from fixture
		await n8n.canvas.importWorkflow('Test_9999_SUG_38.json', 'SUG_38_Test_Workflow');

		// Click zoom to fit
		await n8n.canvas.clickZoomToFitButton();

		// Execute workflow and wait for completion
		await n8n.workflowComposer.executeWorkflowAndWaitForNotification(
			'Workflow executed successfully',
		);

		// Open the 'Repro1' node
		await n8n.canvas.openNode('Repro1');

		// Assert inline expression is valid
		await n8n.ndv.assertInlineExpressionValid();

		// Verify parameter expression preview value shows 'hello there'
		await expect(n8n.ndv.getParameterExpressionPreviewValue()).toHaveText('hello there');
	});
});
