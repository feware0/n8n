import { nanoid } from 'nanoid';

import type { n8nPage } from '../pages/n8nPage';

/**
 * A class for user interactions with workflows that go across multiple pages.
 */
export class WorkflowComposer {
	constructor(private readonly n8n: n8nPage) {}

	/**
	 * Executes a successful workflow and waits for the notification to be closed.
	 * This waits for http calls and also closes the notification.
	 */
	async executeWorkflowAndWaitForNotification(
		notificationMessage: string,
		options: { timeout?: number } = {},
	) {
		const { timeout = 3000 } = options;
		const responsePromise = this.n8n.page.waitForResponse(
			(response) =>
				response.url().includes('/rest/workflows/') &&
				response.url().includes('/run') &&
				response.request().method() === 'POST',
		);

		await this.n8n.canvas.clickExecuteWorkflowButton();
		await responsePromise;
		await this.n8n.notifications.waitForNotificationAndClose(notificationMessage, { timeout });
	}

	/**
	 * Creates a new workflow by clicking the add workflow button and setting the name
	 * @param workflowName - The name of the workflow to create
	 */
	async createWorkflow(workflowName = 'My New Workflow') {
		await this.n8n.workflows.clickAddWorkflowButton();
		await this.n8n.canvas.setWorkflowName(workflowName);
		await this.n8n.canvas.saveWorkflow();
	}

	/**
	 * Creates a new workflow by importing a JSON file
	 * @param fileName - The workflow JSON file name (e.g., 'test_pdf_workflow.json', will search in workflows folder)
	 * @param name - Optional custom name. If not provided, generates a unique name
	 * @returns The actual workflow name that was used
	 */
	async createWorkflowFromJsonFile(
		fileName: string,
		name?: string,
	): Promise<{ workflowName: string }> {
		const workflowName = name ?? `Imported Workflow ${nanoid(8)}`;
		await this.n8n.goHome();
		await this.n8n.workflows.clickAddWorkflowButton();
		await this.n8n.canvas.importWorkflow(fileName, workflowName);
		return { workflowName };
	}

	/**
	 * Creates a workflow with specific nodes and saves it
	 * @param nodes - Array of node names to add to the workflow
	 * @param workflowName - Optional name for the workflow
	 * @returns The created workflow name
	 */
	async createWorkflowWithNodes(nodes: string[], workflowName?: string): Promise<string> {
		const name = workflowName ?? `Workflow with ${nodes.length} nodes ${nanoid(8)}`;
		await this.n8n.workflows.clickAddWorkflowButton();

		for (const nodeName of nodes) {
			await this.n8n.canvas.addNode(nodeName);
			// Close NDV if it opens after adding the node
			try {
				await this.n8n.page.keyboard.press('Escape');
			} catch {
				// NDV might not be open, continue
			}
		}

		await this.n8n.canvas.setWorkflowName(name);
		await this.n8n.canvas.saveWorkflow();
		return name;
	}

	/**
	 * Creates multiple workflows for testing scenarios that need multiple workflows
	 * @param count - Number of workflows to create
	 * @param baseName - Base name for the workflows
	 * @returns Array of created workflow names
	 */
	async createMultipleWorkflows(count: number, baseName = 'Test Workflow'): Promise<string[]> {
		const workflowNames: string[] = [];

		for (let i = 0; i < count; i++) {
			const name = `${baseName} ${i + 1} ${nanoid(8)}`;
			await this.createWorkflow(name);
			workflowNames.push(name);
			await this.n8n.goHome();
		}

		return workflowNames;
	}

	/**
	 * Sets up a workflow for testing with specific configuration
	 * @param config - Configuration object for the workflow
	 * @returns The created workflow name
	 */
	async setupTestWorkflow(config: {
		name?: string;
		nodes?: string[];
		importFile?: string;
		tags?: string[];
	}): Promise<string> {
		const { name, nodes, importFile, tags } = config;

		if (importFile) {
			const result = await this.createWorkflowFromJsonFile(importFile, name);
			return result.workflowName;
		}

		if (nodes && nodes.length > 0) {
			return await this.createWorkflowWithNodes(nodes, name);
		}

		return await this.createWorkflow(name);
	}
}
