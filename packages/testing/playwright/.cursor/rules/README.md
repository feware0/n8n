# n8n Cypress to Playwright Migration Rules

This directory contains Cursor rules for migrating Cypress tests to Playwright in the n8n codebase.

## Available Rules

### 1. `cypress-migration-workflow.mdc`
**Type**: Auto Attached (when working with test files)
**Purpose**: Provides the complete migration workflow from analysis to verification
**Use when**: Starting a new test file migration

### 2. `playwright-node-patterns.mdc`
**Type**: Agent Requested
**Purpose**: Node naming patterns and execution context guidance
**Use when**: Dealing with node interactions or execution issues

### 3. `playwright-debugging-strategies.mdc`
**Type**: Agent Requested
**Purpose**: Debugging strategies and tools for test failures
**Use when**: Tests are failing and need systematic debugging

### 4. `playwright-test-patterns.mdc`
**Type**: Auto Attached (for spec files)
**Purpose**: Best practices and common patterns for Playwright tests
**Use when**: Writing or refactoring test code

### 5. `n8n-test-structure.mdc`
**Type**: Agent Requested
**Purpose**: Project structure reference and test commands
**Use when**: Need to understand file locations or run commands

### 6. `migration-checklist.mdc`
**Type**: Manual
**Purpose**: Comprehensive checklist to ensure complete migration
**Use when**: Verifying migration completeness

## How to Use

1. **Starting a Migration**: The workflow rule will auto-attach when you open test files
2. **Debugging Issues**: Request the debugging strategies rule when tests fail
3. **Final Verification**: Manually invoke the checklist rule with `@migration-checklist`

## Quick Reference

### Most Important Points
- **One file at a time** - Never migrate multiple files simultaneously
- **Search first** - Always look for existing implementations
- **Use Playwright MCP** - For debugging before trial-and-error
- **Follow CONTRIBUTING.md** - It's the gold standard for patterns

### Common Commands
```bash
# Run test with line reporter
pnpm test:standard --grep "test name" --reporter=line

# Debug with UI
pnpm test:debug

# Start isolated instance
pnpm start:isolated
```

### Key Differences from Cypress
- Node names include suffixes: "Edit Fields (Set)"
- Use NDV execution for node testing, not canvas
- Test IDs differ - check Cypress POMs
- Fixtures go in `packages/testing/playwright/workflows/`

### AI Assistant Testing
- **Default credentials**: `nathan@n8n.io` / `PlaywrightTest123`
- **Feature must be enabled**: Use `api.enableFeature('aiAssistant')`
- **Chat input test ID**: `[data-test-id="chat-input"]`
- **Send button test ID**: `[data-test-id="send-button"]`
- **Canvas button test ID**: `[data-test-id="ask-assistant-canvas-action-button"]`
- **Chat opens automatically**: AI assistant sidebar appears when feature is enabled
- **Input works with `fill()`**: Chat input accepts text via `fill('message')`
- **Send button enables**: Button becomes clickable after typing
