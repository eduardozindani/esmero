import type { Message } from '../../../agent/types.js'

/**
 * Format conversation messages into structured text for LLM prompt
 * Following AI Chef pattern: clean, hierarchical, XML-style structure
 */
export function formatStructured(
  messages: Message[],
  compressedHistory?: string
): string {
  // Format timestamp helper
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  // Format individual message
  const formatMessage = (msg: Message): string => {
    const time = formatTimestamp(msg.timestamp)
    const role = msg.role === 'user' ? 'User' : 'Assistant'

    let formatted = `[${time}] ${role}: ${msg.content}`

    // If this is an agent message with intelligence, include it (for future use)
    if (msg.role === 'agent' && msg.intelligence) {
      formatted = `[Assistant Reasoning]\n${msg.intelligence}\n\n${formatted}`
    }

    return formatted
  }

  // Build structured conversation string
  const parts: string[] = []

  // Compressed history (if exists)
  if (compressedHistory) {
    parts.push('<Conversation_History>')
    parts.push(compressedHistory)
    parts.push('</Conversation_History>')
    parts.push('')
  }

  // Recent messages
  parts.push('<Recent_Messages>')
  messages.forEach(msg => {
    parts.push(formatMessage(msg))
  })
  parts.push('</Recent_Messages>')

  return parts.join('\n')
}
