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
