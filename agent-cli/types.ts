import { Message } from './state/types.js';

export interface AgentContext {
    userIntent: string;
    conversationHistory: Message[]; // Full conversation history for context-aware responses
    projectRoot: string;
    // Future: projectContext, fileContext, etc.
}

export interface AgentResult {
    response: string;
    // Future: fileChanges, reasoning, etc.
    actions?: string[];
}
