import chalk from 'chalk';

/**
 * UI Utilities
 *
 * Provides consistent formatting and styling for CLI output
 */

/**
 * Format user message
 */
export function formatUserMessage(content: string): string {
    return chalk.blue(`You: ${content}`);
}

/**
 * Format agent message
 */
export function formatAgentMessage(content: string): string {
    return chalk.green(`Agent: ${content}`);
}

/**
 * Format system message
 */
export function formatSystemMessage(content: string): string {
    return chalk.yellow(content);
}

/**
 * Format error message
 */
export function formatError(content: string): string {
    return chalk.red(`✗ Error: ${content}`);
}

/**
 * Format success message
 */
export function formatSuccess(content: string): string {
    return chalk.green(`✓ ${content}`);
}

/**
 * Visual separator
 */
export function separator(): string {
    return chalk.gray('─'.repeat(50));
}

/**
 * Welcome banner
 */
export function welcomeBanner(): string {
    return chalk.bold.cyan(`
╔════════════════════════════════════════╗
║     Welcome to Esmero Agent CLI        ║
╚════════════════════════════════════════╝

`) + chalk.dim(`Available commands:
  /help     - Show this help
  /history  - View conversation history
  /back     - Undo last exchange
  /reset    - Clear conversation
  /stop     - Exit CLI

`) + separator() + '\n';
}

/**
 * Processing indicator (simple version)
 */
export function processingMessage(): string {
    return chalk.dim('Processing...');
}

/**
 * Goodbye message
 */
export function goodbyeMessage(): string {
    return chalk.cyan('\n👋 Goodbye!\n');
}