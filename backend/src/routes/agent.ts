import { Router } from 'express'
import { handleAgentRequest } from '../agent/handler.js'
import { determineContext } from '../agent/context/context.js'
import { buildPrompts } from '../agent/execution/prompt.js'
import { AgentResponseSchema } from '../agent/types.js'
import { streamStructuredCompletion, extractCompletedChunks } from '../utils/llmStreaming.js'
import type { IncomingAgentRequest } from '../agent/types.js'

const router = Router()

/**
 * POST /agent
 * Main agent endpoint - handles conversation with writing assistant
 */
router.post('/agent', async (req, res) => {
  try {
    const request = req.body as IncomingAgentRequest

    // Validate request
    if (!request.userMessage || typeof request.userMessage !== 'string') {
      res.status(400).json({ error: 'userMessage is required' })
      return
    }

    if (!Array.isArray(request.conversationHistory)) {
      res.status(400).json({ error: 'conversationHistory must be an array' })
      return
    }

    if (!Array.isArray(request.documents)) {
      res.status(400).json({ error: 'documents must be an array' })
      return
    }

    // Handle agent request
    const result = await handleAgentRequest(request)

    // Return result
    res.json({
      message: result.response,
      diff: result.diff,
      reasoning: result.reasoning  // Include for debugging (can remove in production)
    })
  } catch (error) {
    console.error('Agent route error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /agent/stream
 * Streaming agent endpoint - returns SSE stream with progressive diff chunks
 */
router.post('/agent/stream', async (req, res) => {
  try {
    const request = req.body as IncomingAgentRequest

    // Validate request
    if (!request.userMessage || typeof request.userMessage !== 'string') {
      res.status(400).json({ error: 'userMessage is required' })
      return
    }

    if (!Array.isArray(request.conversationHistory)) {
      res.status(400).json({ error: 'conversationHistory must be an array' })
      return
    }

    if (!Array.isArray(request.documents)) {
      res.status(400).json({ error: 'documents must be an array' })
      return
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    // IMPORTANT: Add current user message to conversation history
    // The frontend sends previous messages in conversationHistory,
    // but the CURRENT message needs to be included for context
    const fullConversationHistory = [
      ...request.conversationHistory,
      {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: request.userMessage,
        timestamp: Date.now()
      }
    ]

    // Determine context (same as synchronous flow)
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
      maxTokens: 4000  // Increased for streaming large responses
    })

    for await (const delta of stream) {
      accumulatedJSON += delta

      // Try to extract any newly completed chunks
      const { chunks, newCount } = extractCompletedChunks(accumulatedJSON, lastExtractedCount)

      if (chunks.length > 0) {
        console.log(`📦 Extracted ${chunks.length} new chunks (total: ${newCount})`)

        // Send each new chunk via SSE
        for (const chunk of chunks) {
          console.log('Sending chunk:', chunk)

          const sseData = {
            type: 'chunk',
            chunk: {
              id: `chunk-${Date.now()}-${lastExtractedCount}`,
              ...chunk
            }
          }

          res.write(`data: ${JSON.stringify(sseData)}\n\n`)
          lastExtractedCount++
        }
      }
    }

    // Parse final complete response
    try {
      const finalResponse = JSON.parse(accumulatedJSON)

      // Send final message (response text)
      res.write(`data: ${JSON.stringify({
        type: 'message',
        message: finalResponse.response,
        reasoning: finalResponse.reasoning
      })}\n\n`)

      // Send completion signal
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)

    } catch (error) {
      console.error('Failed to parse final response:', error)
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Failed to parse agent response'
      })}\n\n`)
    }

    res.end()

  } catch (error) {
    console.error('Streaming agent route error:', error)

    // Send error via SSE
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Internal server error'
    })}\n\n`)

    res.end()
  }
})

export default router
