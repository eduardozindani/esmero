export interface Document {
  id: string
  content: string
  title: string
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

export interface AppState {
  documents: Document[]
  projects: Project[]
  currentDocumentId: string | null
  currentProjectId: string | null
}
