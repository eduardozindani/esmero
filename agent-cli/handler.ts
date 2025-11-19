import { determineContext } from './context/index.js';
import { executeAgent } from './agent/index.js';
import { AgentResult } from './types.js';
import { Message } from './state/types.js';

export async function handleAgentRequest(
    message: string,
    conversationHistory: Message[]
): Promise<AgentResult> {
    console.log('\n[Handler] Processing request...');

    // 1. Determine Context (with conversation history)
    const context = await determineContext(message, conversationHistory);

    // 2. Execute Agent
    const result = await executeAgent(context);

    console.log('[Handler] Request processed.\n');
    return result;
}
