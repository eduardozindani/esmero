import { ConversationState } from '../state/ConversationState.js';
import {
    CommandResult,
    COMMANDS,
    executeHelp,
    executeHistory,
    executeBack,
    executeReset,
    executeExit,
} from './commands.js';

/**
 * Command Handler
 *
 * Routes commands to appropriate handlers
 */
export class CommandHandler {
    /**
     * Check if input is a command
     */
    static isCommand(input: string): boolean {
        return input.trim().startsWith('/');
    }

    /**
     * Execute a command
     *
     * @param input - User input (must start with /)
     * @param state - Current conversation state
     * @returns Command execution result
     */
    static async execute(input: string, state: ConversationState): Promise<CommandResult> {
        const command = input.trim().toLowerCase();

        switch (command) {
            case COMMANDS.HELP:
                return executeHelp();

            case COMMANDS.HISTORY:
                return executeHistory(state);

            case COMMANDS.BACK:
                return executeBack(state);

            case COMMANDS.RESET:
                return executeReset(state);

            case COMMANDS.STOP:
            case COMMANDS.EXIT:
                return executeExit();

            default:
                return {
                    shouldExit: false,
                    message: `Unknown command: ${command}\nType /help to see available commands.`,
                };
        }
    }
}