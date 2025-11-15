export interface Document {
  id: string
  title: string
  content: string
  createdAt: number
}

export interface AgentRequest {
  canvasContent: string
  selectedText?: string
  userMessage: string
}

export interface AgentResponse {
  message?: string
  diff?: {
    oldText: string
    newText: string
  }
}
