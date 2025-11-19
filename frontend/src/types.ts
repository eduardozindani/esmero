export interface Document {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  folderId: string | null
  titleUserModified?: boolean     // If true, AI won't overwrite title

  // Animation state flags (never persisted to localStorage)
  titleLoading?: boolean          // Shows skeleton loader during title generation
  titleJustGenerated?: boolean    // Triggers fadeIn animation when title arrives
  documentJustCreated?: boolean   // Triggers slideIn animation when document is created
  documentDeleting?: boolean      // Triggers slideOut animation before deletion
}

export interface Folder {
  id: string
  name: string
  parentFolderId: string | null  // null = root level folder
  createdAt: number
  updatedAt: number
  
  // Animation state flags
  folderJustCreated?: boolean
  folderDeleting?: boolean
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
  currentFolderId?: string
  documents: Document[]
  folders: Folder[]
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
