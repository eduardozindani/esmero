import { AgentContext } from '../types.js';
import { Message } from '../state/types.js';

export async function determineContext(
    message: string,
    conversationHistory: Message[]
): Promise<AgentContext> {
    console.log('  [Context] Analyzing message:', message);
    console.log('  [Context] History length:', conversationHistory.length);

    // Mock logic: Just pass the message as intent for now
    // In the future, this will:
    // - Scan files based on conversation context
    // - Check git status
    // - Classify task type (bug fix, feature, refactor, etc.)
    // - Determine relevant files and context
    return {
        userIntent: message,
        conversationHistory,
        projectRoot: process.cwd()
    };
}
