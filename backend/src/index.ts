import express from 'express'
import cors from 'cors'
import type { AgentRequest, AgentResponse } from './types.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Backend alive' })
})

app.post('/agent', (req, res) => {
  const request = req.body as AgentRequest

  const response: AgentResponse = {
    message: `Received: "${request.userMessage}". Canvas has ${request.canvasContent.length} characters.`
  }

  res.json(response)
})

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
