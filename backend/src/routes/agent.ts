import { Router } from 'express'
import { handleAgentRequest } from '../agent/handler.js'
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

export default router
