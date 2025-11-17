import type { Document, Folder } from '../types'

const DOCUMENTS_KEY = 'esmero_documents'
const FOLDERS_KEY = 'esmero_folders'
const OLD_PROJECTS_KEY = 'esmero_projects' // Keep for migration

export const loadDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem(DOCUMENTS_KEY)
    if (!stored) return []

    // Parse documents and clean any stale loading states
    const documents: Document[] = JSON.parse(stored)
    return documents.map(doc => ({
      ...doc,
      // Reset any stale loading states from previous sessions
      titleLoading: false,
      titleJustGenerated: false  // Clean up animation flags
    }))
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

export const loadFolders = (): Folder[] => {
  try {
    // First try to load from new key
    let stored = localStorage.getItem(FOLDERS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }

    // If not found, try old projects key for migration
    stored = localStorage.getItem(OLD_PROJECTS_KEY)
    if (stored) {
      const folders = JSON.parse(stored)
      // Save to new key and remove old one
      localStorage.setItem(FOLDERS_KEY, stored)
      localStorage.removeItem(OLD_PROJECTS_KEY)
      return folders
    }

    return []
  } catch (error) {
    console.error('Failed to load folders:', error)
    return []
  }
}

export const saveFolders = (folders: Folder[]): void => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders))
  } catch (error) {
    console.error('Failed to save folders:', error)
  }
}
