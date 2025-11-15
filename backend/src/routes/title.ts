import { Router } from 'express'
import { generateTitleFromContent } from '../services/openai.js'
import type { TitleRequest, TitleResponse } from '../types.js'

const router = Router()

router.post('/generate-title', async (req, res) => {
  try {
    const { content } = req.body as TitleRequest

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content is required' })
      return
    }

    const title = await generateTitleFromContent(content)
    const response: TitleResponse = { title }

    res.json(response)
  } catch (error) {
    console.error('Title generation error:', error)
    res.status(500).json({ error: 'Failed to generate title' })
  }
})

export default router
