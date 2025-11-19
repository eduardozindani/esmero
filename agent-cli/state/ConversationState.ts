import { Message, ConversationMetadata } from './types.js';
import { randomUUID } from 'crypto';

/**
 * Manages conversation state and history
 *
 * Responsibilities:
 * - Track all messages (user, agent, system)
 * - Provide history for context determination
 * - Support conversation manipulation (undo, reset)
 */
export class ConversationState {
    private messages: Message[] = [];
    private sessionId: string;
    private startedAt: string;

    constructor() {
        this.sessionId = randomUUID();
        this.startedAt = new Date().toISOString();
    }

    /**
     * Add a message to the conversation
     */
    addMessage(role: Message['role'], content: string): void {
        this.messages.push({
            role,
            content,
            timestamp: new Date().toISOString(),
        });
    }

    /**
     * Remove the last user+agent exchange
     *
     * @returns true if removed, false if insufficient messages
     */
    removeLastExchange(): boolean {
        // Need at least 2 messages (user + agent) to remove an exchange
        if (this.messages.length < 2) {
            return false;
        }

        // Remove agent response
        const lastMessage = this.messages[this.messages.length - 1];
        if (lastMessage?.role === 'agent') {
            this.messages.pop();
        }

        // Remove user message
        const secondLastMessage = this.messages[this.messages.length - 1];
        if (secondLastMessage?.role === 'user') {
            this.messages.pop();
            return true;
        }

        return false;
    }

    /**
     * Clear all messages
     */
    reset(): void {
        this.messages = [];
        this.sessionId = randomUUID();
        this.startedAt = new Date().toISOString();
    }

    /**
     * Get all messages (for passing to agent context)
     */
    getHistory(): Message[] {
        return [...this.messages]; // Return copy to prevent external mutation
    }

    /**
     * Get formatted conversation history for display
     */
    getFormattedHistory(): string {
        if (this.messages.length === 0) {
            return 'No messages yet.';
        }

        return this.messages
            .map(msg => {
                const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });
                const roleLabel = msg.role === 'user' ? 'You' : msg.role === 'agent' ? 'Agent' : 'System';
                return `[${time}] ${roleLabel}:\n${msg.content}`;
            })
            .join('\n\n');
    }

    /**
     * Get conversation metadata
     */
    getMetadata(): ConversationMetadata {
        return {
            sessionId: this.sessionId,
            startedAt: this.startedAt,
            messageCount: this.messages.length,
        };
    }

    /**
     * Check if conversation is empty
     */
    isEmpty(): boolean {
        return this.messages.length === 0;
    }
}