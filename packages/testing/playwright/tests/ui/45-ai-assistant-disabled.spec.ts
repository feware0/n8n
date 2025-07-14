import { test, expect } from '../../fixtures/base';
import { nanoid } from 'nanoid';

test.describe('AI Assistant::disabled', () => {
	test.beforeEach(async ({ n8n, api }) => {
		await api.disableFeature('aiAssistant');
		await n8n.goHome();
	});

	test('does not show assistant button if feature is disabled', async ({ n8n }) => {
		// When AI Assistant feature is disabled, the floating button should not exist
		await expect(n8n.aiAssistant.getAskAssistantFloatingButton()).toHaveCount(0);
	});
});

test.describe('AI Assistant::enabled', () => {
	test.beforeEach(async ({ n8n, api }) => {
		await api.enableFeature('aiAssistant');
		await n8n.page.goto('/workflow/new');
	});

	test.afterEach(async ({ api }) => {
		await api.disableFeature('aiAssistant');
	});

	test('renders placeholder UI', async ({ n8n }) => {
		// Check that the assistant button is visible
		await expect(n8n.aiAssistant.getAskAssistantCanvasActionButton()).toBeVisible();

		// Click the assistant button to open chat
		await n8n.aiAssistant.getAskAssistantCanvasActionButton().click();

		// Verify chat is visible
		await expect(n8n.aiAssistant.getAskAssistantChat()).toBeVisible();

		// Verify placeholder message is visible
		await expect(n8n.aiAssistant.getPlaceholderMessage()).toBeVisible();

		// Verify chat input is visible
		await expect(n8n.aiAssistant.getChatInput()).toBeVisible();

		// Verify send button is disabled initially
		await expect(n8n.aiAssistant.getSendMessageButton()).toBeDisabled();

		// Verify close button is visible
		await expect(n8n.aiAssistant.getCloseChatButton()).toBeVisible();

		// Click close button
		await n8n.aiAssistant.getCloseChatButton().click();

		// Verify chat is no longer visible
		await expect(n8n.aiAssistant.getAskAssistantChat()).not.toBeVisible();
	});

	test('should show resizer when chat is open', async ({ n8n }) => {
		// Click the assistant button to open chat
		await n8n.aiAssistant.getAskAssistantCanvasActionButton().click();

		// Verify resizer is visible
		await expect(n8n.aiAssistant.getAskAssistantSidebarResizer()).toBeVisible();

		// Verify chat is visible
		await expect(n8n.aiAssistant.getAskAssistantChat()).toBeVisible();

		// Test that we can interact with the resizer (hover)
		await n8n.aiAssistant.getAskAssistantSidebarResizer().hover();

		// Close the chat
		await n8n.aiAssistant.getCloseChatButton().click();
	});

	test('should start chat session from node error view', async ({ n8n, page }) => {
		// Set up API interception for AI chat before any actions
		await page.route('**/rest/ai/chat', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					sessionId: '1',
					messages: [
						{
							role: 'assistant',
							type: 'message',
							text: 'Hey, this is an assistant message',
						},
					],
				}),
			});
		});

		// Import the test workflow with unique name
		const workflowName = `AI_Assistant_Test_Workflow_${nanoid(8)}`;
		await n8n.canvas.importWorkflow('ai_assistant_test_workflow.json', workflowName);

		// Open the 'Stop and Error' node
		await n8n.canvas.openNode('Stop and Error');

		// Execute the node to trigger an error
		await n8n.ndv.execute();

		// Verify the assistant button is visible and clickable
		await expect(n8n.aiAssistant.getNodeErrorViewAssistantButton()).toBeVisible();
		await expect(n8n.aiAssistant.getNodeErrorViewAssistantButton()).toBeEnabled();

		// Click the assistant button in the error view
		await n8n.aiAssistant.getNodeErrorViewAssistantButton().click();

		// Wait a bit for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Verify we have one chat message
		await expect(n8n.aiAssistant.getChatMessagesAll()).toHaveCount(1);

		// Verify the message contains the expected text
		await expect(n8n.aiAssistant.getChatMessagesAll().first()).toContainText(
			'Hey, this is an assistant message',
		);

		// Verify the assistant button is now disabled
		await expect(n8n.aiAssistant.getNodeErrorViewAssistantButton()).toBeDisabled();
	});

	test('should render chat input correctly', async ({ n8n, page }) => {
		// Set up API interception for AI chat
		await page.route('**/rest/ai/chat', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					sessionId: '1',
					messages: [
						{
							role: 'assistant',
							type: 'message',
							text: 'Hey, this is an assistant message',
						},
					],
				}),
			});
		});

		// Import the test workflow with unique name
		const workflowName = `AI_Assistant_Test_Workflow_${nanoid(8)}`;
		await n8n.canvas.importWorkflow('ai_assistant_test_workflow.json', workflowName);

		// Click the canvas assistant button to open chat (simpler approach)
		await n8n.aiAssistant.getAskAssistantCanvasActionButton().click();

		// Wait for the chat to be fully loaded and visible
		await expect(n8n.aiAssistant.getAskAssistantChat()).toBeVisible();
		await expect(n8n.aiAssistant.getChatInput()).toBeVisible();

		// Send button should be disabled when input is empty
		await expect(n8n.aiAssistant.getSendMessageButton()).toBeDisabled();

		// Type text using fill() - this works based on MCP testing
		await n8n.aiAssistant.getChatInput().fill('Test message');

		// Verify the input has the value we typed
		await expect(n8n.aiAssistant.getChatInput()).toHaveValue('Test message');

		// Send button should be enabled now
		await expect(n8n.aiAssistant.getSendMessageButton()).toBeEnabled();

		// Click send button
		await n8n.aiAssistant.getSendMessageButton().click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Verify user message was sent
		await expect(n8n.aiAssistant.getChatMessagesUser()).toHaveCount(1);

		// Chat input should be cleared now
		await expect(n8n.aiAssistant.getChatInput()).toHaveValue('');
	});

	test('should render and handle quick replies', async ({ n8n, page }) => {
		// Set up API interception for AI chat with quick replies
		await page.route('**/rest/ai/chat', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					sessionId: '1',
					messages: [
						{
							role: 'assistant',
							type: 'message',
							text: 'Hey, this is an assistant message',
							quickReplies: [
								{
									text: "Sure, let's do it",
									type: 'yes',
								},
								{
									text: "Nah, doesn't sound good",
									type: 'no',
								},
							],
						},
					],
				}),
			});
		});

		// Import the test workflow with unique name
		const workflowName = `AI_Assistant_Test_Workflow_${nanoid(8)}`;
		await n8n.canvas.importWorkflow('ai_assistant_test_workflow.json', workflowName);

		// Open the 'Stop and Error' node
		await n8n.canvas.openNode('Stop and Error');

		// Execute the node to trigger an error
		await n8n.ndv.execute();

		// Click the assistant button in the error view
		await n8n.aiAssistant.getNodeErrorViewAssistantButton().click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Verify we have 2 quick reply buttons
		await expect(n8n.aiAssistant.getQuickReplyButtons()).toHaveCount(2);

		// Click the first quick reply button
		await n8n.aiAssistant.getQuickReplyButtons().first().click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Verify user message was sent
		await expect(n8n.aiAssistant.getChatMessagesUser()).toHaveCount(1);

		// Verify the message contains the expected text
		await expect(n8n.aiAssistant.getChatMessagesUser().first()).toContainText("Sure, let's do it");
	});

	test('should warn before starting a new session', async ({ n8n, page }) => {
		// Set up API interception for AI chat
		await page.route('**/rest/ai/chat', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					sessionId: '1',
					messages: [
						{
							role: 'assistant',
							type: 'message',
							text: 'Hey, this is an assistant message',
						},
					],
				}),
			});
		});

		// Import the test workflow with unique name
		const workflowName = `AI_Assistant_Test_Workflow_${nanoid(8)}`;
		await n8n.canvas.importWorkflow('ai_assistant_test_workflow.json', workflowName);

		// Open the 'Edit Fields' node first
		await n8n.canvas.openNode('Edit Fields');

		// Execute the node to trigger an error
		await n8n.ndv.execute();

		// Click the assistant button in the error view
		await n8n.aiAssistant.getNodeErrorViewAssistantButton().click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Close the chat
		await n8n.aiAssistant.getCloseChatButton().click();

		// Go back to canvas
		await n8n.ndv.clickBackToCanvasButton();

		// Open the 'Stop and Error' node
		await n8n.canvas.openNode('Stop and Error');

		// Execute the node to trigger an error
		await n8n.ndv.execute();

		// Click the assistant button in the error view (should trigger warning)
		await n8n.aiAssistant.getNodeErrorViewAssistantButton().click();

		// Since we already have an active session, a warning should be shown
		await expect(n8n.aiAssistant.getNewAssistantSessionModal()).toBeVisible();

		// Click the "Start new session" button
		await n8n.aiAssistant
			.getNewAssistantSessionModal()
			.getByRole('button', { name: 'Start new session' })
			.click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// New session should start with initial assistant message
		await expect(n8n.aiAssistant.getChatMessagesAll()).toHaveCount(1);
	});

	test('should end chat session when `end_session` event is received', async ({ n8n, page }) => {
		// Set up API interception for AI chat with end session
		await page.route('**/rest/ai/chat', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					sessionId: '1',
					messages: [
						{
							role: 'assistant',
							type: 'message',
							title: 'Glad to Help',
							text: "I'm glad I could help. If you have any more questions or need further assistance with your n8n workflows, feel free to ask!",
						},
						{
							role: 'assistant',
							type: 'event',
							eventName: 'end-session',
						},
					],
				}),
			});
		});

		// Import the test workflow with unique name
		const workflowName = `AI_Assistant_Test_Workflow_${nanoid(8)}`;
		await n8n.canvas.importWorkflow('ai_assistant_test_workflow.json', workflowName);

		// Open the 'Stop and Error' node
		await n8n.canvas.openNode('Stop and Error');

		// Execute the node to trigger an error
		await n8n.ndv.execute();

		// Click the assistant button in the error view
		await n8n.aiAssistant.getNodeErrorViewAssistantButton().click();

		// Wait for the response to be processed
		await n8n.page.waitForTimeout(1000);

		// Verify we have one system message about session ending
		await expect(n8n.aiAssistant.getChatMessagesSystem()).toHaveCount(1);

		// Verify the system message contains the expected text
		await expect(n8n.aiAssistant.getChatMessagesSystem().first()).toContainText(
			'session has ended',
		);
	});
});
