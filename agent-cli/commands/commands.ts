import { ConversationState } from '../state/ConversationState.js';

/**
 * Command execution result
 */
export type CommandResult = {
    shouldExit: boolean;
    message?: string;
};

/**
 * Available CLI commands
 */
export const COMMANDS = {
    HELP: '/help',
    HISTORY: '/history',
    BACK: '/back',
    RESET: '/reset',
    STOP: '/stop',
    EXIT: '/exit',
} as const;

/**
 * Execute /help command
 */
export function executeHelp(): CommandResult {
    const helpText = `
Available commands:
  /help     - Show this help message
  /history  - View conversation history
  /back     - Undo last exchange (remove last user+agent messages)
  /reset    - Clear conversation and start fresh
  /stop     - Exit the CLI
  /exit     - Exit the CLI
`;
    return {
        shouldExit: false,
        message: helpText,
    };
}

/**
 * Execute /history command
 */
export function executeHistory(state: ConversationState): CommandResult {
    const history = state.getFormattedHistory();
    const metadata = state.getMetadata();

    const historyText = `
═══════════════════════════════════════
          CONVERSATION HISTORY
═══════════════════════════════════════

${history}

═══════════════════════════════════════
Session: ${metadata.sessionId.slice(0, 8)}
Messages: ${metadata.messageCount}
Started: ${new Date(metadata.startedAt).toLocaleString()}
═══════════════════════════════════════
`;

    return {
        shouldExit: false,
        message: historyText,
    };
}

/**
 * Execute /back command
 */
export function executeBack(state: ConversationState): CommandResult {
    const removed = state.removeLastExchange();

    if (removed) {
        return {
            shouldExit: false,
            message: '✓ Removed last exchange',
        };
    } else {
        return {
            shouldExit: false,
            message: '✗ No exchange to remove (conversation is empty or has only one message)',
        };
    }
}

/**
 * Execute /reset command
 */
export function executeReset(state: ConversationState): CommandResult {
    state.reset();
    return {
        shouldExit: false,
        message: '✓ Conversation reset. Starting fresh!',
    };
}

/**
 * Execute /stop or /exit command
 */
export function executeExit(): CommandResult {
    return {
        shouldExit: true,
        message: 'Goodbye! 👋',
    };
}