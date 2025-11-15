export interface Document {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  projectId: string | null
  titleLoading?: boolean
}

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

// Agent Message Type
export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

// Agent Request (sent to backend)
export interface AgentRequest {
  userMessage: string
  conversationHistory: Message[]
  canvasContent: string
  selectedText?: string
  currentDocumentId?: string
  currentProjectId?: string
  documents: Document[]
}

// Agent Response (received from backend)
export interface AgentResponse {
  message: string
  diff?: {
    chunks: Array<{
      oldText: string
      newText: string
      explanation: string
    }>
    explanation: string
  }
  reasoning?: string  // For debugging
}
