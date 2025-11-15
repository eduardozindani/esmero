import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import titleRouter from './routes/title.js'
import agentRouter from './routes/agent.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({ message: 'Backend alive' })
})

// API routes
app.use('/api', titleRouter)
app.use('/api', agentRouter)

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})
