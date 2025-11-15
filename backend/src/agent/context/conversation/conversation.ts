import type { Message, ConversationContext } from '../../../agent/types.js'
import { prepareHistory } from './preparation.js'
import { formatStructured } from './formatting.js'

/**
 * Determine conversation context from message history
 * Following AI Chef orchestration pattern
 */
export async function determineConversation(
  messages: Message[]
): Promise<ConversationContext> {
  try {
    // Step 1: Prepare history (truncate or compress)
    const { recentMessages, compressedHistory } = prepareHistory(messages)

    // Step 2: Format into structured text for LLM
    const structured = formatStructured(recentMessages, compressedHistory)

    return {
      messages: recentMessages,
      structured
    }
  } catch (error) {
    console.error('Error determining conversation context:', error)

    // Graceful fallback (AI Chef pattern)
    return {
      messages: messages.slice(-8),  // Last 8 messages as fallback
      structured: '<Recent_Messages>\n[Error loading conversation history]\n</Recent_Messages>'
    }
  }
}
