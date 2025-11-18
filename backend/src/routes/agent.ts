import { Router } from 'express'
import { handleAgentRequest } from '../agent/handler.js'
import { streamAgentResponse } from '../services/agentService.js'
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

    const stream = streamAgentResponse(request)

    for await (const event of stream) {
      if (event.type === 'chunk') {
        console.log('Sending chunk:', event.chunk)
        res.write(`data: ${JSON.stringify({ type: 'chunk', chunk: event.chunk })}\n\n`)
      } else if (event.type === 'message') {
        res.write(`data: ${JSON.stringify({
          type: 'message',
          message: event.message,
          reasoning: event.reasoning
        })}\n\n`)
      } else if (event.type === 'done') {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
      } else if (event.type === 'error') {
        res.write(`data: ${JSON.stringify({ type: 'error', error: event.error })}\n\n`)
      }
    }

    res.end()

  } catch (error) {
    console.error('Streaming agent route error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Internal server error'
      })}\n\n`)
      res.end()
    }
  }
})

export default router
