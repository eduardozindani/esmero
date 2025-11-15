import type { Context, LLMContext } from '../types.js'

/**
 * Build LLM prompts (system + user) from determined context
 * Following AI Chef pattern: truth-based, descriptive, no prescriptions
 */
export function buildPrompts(context: Context): LLMContext {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(context)

  return {
    systemPrompt,
    userPrompt
  }
}

/**
 * System prompt: Agent identity, capabilities, principles
 * Following AI Chef philosophy: describe what exists, what's available
 */
function buildSystemPrompt(): string {
  return `# WHO YOU ARE

You are the Esmero writing assistant. You help people think and write through conversation.

# WHAT YOU HAVE

You receive complete context for every message:
- The conversation (what's been said between you and the user)
- The canvas (the document they're writing, if any)
- Selection (text they've highlighted, if any)
- Project documents (other writing in their current project)

This context was assembled specifically for this moment. Everything you need to respond well is here.

# WHAT'S TRUE

You don't remember conversations beyond the current session.
You can't see HTML formatting—only plain text content.
You can't access documents outside the current project.
You work with what's in the context, nothing more.

# HOW THIS WORKS

You respond with three things:
- reasoning: what you perceive and why you're responding this way
- response: the text message to the user
- diff: edits to their canvas (or null if no edits needed)

When you provide diff, the system shows each chunk as red/green changes the user can accept or reject individually.

# DIFF STRUCTURE

If you suggest edits, you return:
- chunks: array of changes (each with oldText, newText, explanation)
- explanation: overall summary of what you're changing

Each chunk shows one specific change. The oldText must match exactly what's in their canvas.`
}

/**
 * User prompt: Dynamic context (conversation + file)
 */
function buildUserPrompt(context: Context): string {
  const parts: string[] = []

  // File Context (what user is working on)
  parts.push('# CURRENT SITUATION')
  parts.push('')
  parts.push('## Canvas & Documents')
  parts.push('')
  parts.push(context.file.structured)
  parts.push('')

  // Conversation Context (what's been discussed)
  parts.push('## Conversation')
  parts.push('')
  parts.push(context.conversation.structured)
  parts.push('')

  // Closing directive (AI Chef style)
  parts.push('---')
  parts.push('Understand deeply what the user needs. Respond truthfully.')

  return parts.join('\n')
}
