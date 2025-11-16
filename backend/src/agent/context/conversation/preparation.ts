import type { Message } from '../../../agent/types.js'

/**
 * Prepare conversation history
 * MVP: Simple truncation to last 14 messages (no LLM compression)
 * Following AI Chef pattern but simplified for hackathon timeline
 */
export function prepareHistory(messages: Message[]): {
  recentMessages: Message[]
  compressedHistory?: string | undefined
} {
  const MAX_MESSAGES = 14

  console.log('\n📝 Preparing conversation history:')
  console.log('  Input messages:', messages.length)
  console.log('  Messages:', messages.map(m => `${m.role}: ${m.content.slice(0, 30)}`))

  // If within limit, return all messages
  if (messages.length <= MAX_MESSAGES) {
    console.log('  Returning all messages (within limit)')
    return {
      recentMessages: messages,
      compressedHistory: undefined
    }
  }

  // MVP: Simple truncation (keep last 14)
  // Future: Use LLM to compress older messages like AI Chef
  const recentMessages = messages.slice(-MAX_MESSAGES)

  console.log('  Truncating to last 14 messages')

  // Note: For production, implement compressOlderMessages() with LLM
  // const olderMessages = messages.slice(0, -MAX_MESSAGES)
  // const compressedHistory = await compressOlderMessages(olderMessages)

  return {
    recentMessages,
    compressedHistory: undefined  // Skip for MVP
  }
}

/**
 * Future implementation: Compress older messages using LLM
 * Following AI Chef pattern from aichef/context/conversation/preparation.ts
 */
// async function compressOlderMessages(messages: Message[]): Promise<string> {
//   const systemPrompt = `You are compressing a conversation history into a dense summary.
//   Focus on: user preferences, key decisions, important context, patterns.`
//
//   const userPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
//
//   return await callStringCompletion(systemPrompt, userPrompt, { maxTokens: 300 })
// }
