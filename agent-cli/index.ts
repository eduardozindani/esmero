import inquirer from 'inquirer';
import { handleAgentRequest } from './handler.js';
import { ConversationState } from './state/ConversationState.js';
import { CommandHandler } from './commands/CommandHandler.js';
import {
    welcomeBanner,
    formatAgentMessage,
    formatError,
    formatSystemMessage,
    separator,
    processingMessage,
    goodbyeMessage,
} from './utils/ui.js';

async function startCLI() {
    // Initialize conversation state
    const conversationState = new ConversationState();

    // Display welcome banner
    console.log(welcomeBanner());

    // Handle graceful exit on Ctrl+C
    process.on('SIGINT', () => {
        console.log(goodbyeMessage());
        process.exit(0);
    });

    // Main conversation loop
    while (true) {
        const { message } = await inquirer.prompt([
            {
                type: 'input',
                name: 'message',
                message: 'You:',
            },
        ]);

        // Skip empty messages
        if (!message.trim()) {
            continue;
        }

        // Handle commands
        if (CommandHandler.isCommand(message)) {
            try {
                const commandResult = await CommandHandler.execute(message, conversationState);

                // Display command result message
                if (commandResult.message) {
                    console.log(formatSystemMessage(commandResult.message));
                }

                // Exit if command requested
                if (commandResult.shouldExit) {
                    console.log(goodbyeMessage());
                    break;
                }

                console.log(separator());
                continue;
            } catch (error) {
                console.log(formatError(`Command execution failed: ${error}`));
                console.log(separator());
                continue;
            }
        }

        // Add user message to conversation state
        conversationState.addMessage('user', message);

        try {
            // Show processing indicator
            console.log(processingMessage());

            // Get conversation history for context
            const history = conversationState.getHistory();

            // Handle agent request
            const result = await handleAgentRequest(message, history);

            // Add agent response to conversation state
            conversationState.addMessage('agent', result.response);

            // Display agent response
            console.log(formatAgentMessage(result.response));
        } catch (error) {
            // Display error
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log(formatError(`Failed to process request: ${errorMessage}`));

            // Add error to conversation state as system message
            conversationState.addMessage('system', `Error: ${errorMessage}`);
        }

        console.log(separator());
    }
}

// Start the CLI
startCLI().catch(error => {
    console.error(formatError(`Fatal error: ${error}`));
    process.exit(1);
});
