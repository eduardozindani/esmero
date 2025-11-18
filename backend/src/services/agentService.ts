import { determineContext } from '../agent/context/context.js'
import { buildPrompts } from '../agent/execution/prompt.js'
import { AgentResponseSchema } from '../agent/types.js'
import { streamStructuredCompletion, extractCompletedChunks } from '../utils/llmStreaming.js'
import type { IncomingAgentRequest } from '../agent/types.js'

export type StreamEvent = 
  | { type: 'chunk', chunk: any }
  | { type: 'message', message: string, reasoning?: string }
  | { type: 'done' }
  | { type: 'error', error: string }

export async function* streamAgentResponse(request: IncomingAgentRequest): AsyncGenerator<StreamEvent> {
  try {
    // IMPORTANT: Add current user message to conversation history
    const fullConversationHistory = [
      ...request.conversationHistory,
      {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: request.userMessage,
        timestamp: Date.now()
      }
    ]

    // Determine context
    const context = await determineContext({
      ...request,
      conversationHistory: fullConversationHistory
    })

    // Build prompts
    const promptContext = buildPrompts(context)

    // Track state for incremental chunk extraction
    let accumulatedJSON = ''
    let lastExtractedCount = 0

    // Stream the response
    const stream = streamStructuredCompletion(promptContext, {
      schema: AgentResponseSchema,
      schemaName: 'agent_response',
      schemaDescription: 'Structured response from the writing assistant',
      model: 'gpt-4.1',
      temperature: 0.7,
      maxTokens: 4000
    })

    for await (const delta of stream) {
      accumulatedJSON += delta

      // Try to extract any newly completed chunks
      const { chunks, newCount } = extractCompletedChunks(accumulatedJSON, lastExtractedCount)

      if (chunks.length > 0) {
        console.log(`📦 Extracted ${chunks.length} new chunks (total: ${newCount})`)

        for (const chunk of chunks) {
          yield {
            type: 'chunk',
            chunk: {
              id: `chunk-${Date.now()}-${lastExtractedCount}`,
              ...chunk
            }
          }
          lastExtractedCount++
        }
      }
    }

    // Parse final complete response
    try {
      const finalResponse = JSON.parse(accumulatedJSON)

      yield {
        type: 'message',
        message: finalResponse.response,
        reasoning: finalResponse.reasoning
      }

      yield { type: 'done' }

    } catch (error) {
      console.error('Failed to parse final response:', error)
      yield { type: 'error', error: 'Failed to parse agent response' }
    }

  } catch (error) {
    console.error('Streaming agent service error:', error)
    yield { type: 'error', error: 'Internal server error' }
  }
}
