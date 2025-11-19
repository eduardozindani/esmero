/**
 * Message in conversation history
 */
export type Message = {
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: string; // ISO 8601 format
};

/**
 * Conversation state metadata
 */
export type ConversationMetadata = {
    sessionId: string;
    startedAt: string;
    messageCount: number;
};