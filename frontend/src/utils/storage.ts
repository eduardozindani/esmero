import type { Document, Project } from '../types'

const DOCUMENTS_KEY = 'esmero_documents'
const PROJECTS_KEY = 'esmero_projects'

export const loadDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem(DOCUMENTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load documents:', error)
    return []
  }
}

export const saveDocuments = (documents: Document[]): void => {
  try {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
  } catch (error) {
    console.error('Failed to save documents:', error)
  }
}

export const loadProjects = (): Project[] => {
  try {
    const stored = localStorage.getItem(PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load projects:', error)
    return []
  }
}

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects))
  } catch (error) {
    console.error('Failed to save projects:', error)
  }
}
