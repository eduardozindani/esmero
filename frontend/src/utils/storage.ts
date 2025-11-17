import type { Document, Folder } from '../types'
import { STORAGE_KEYS } from '../constants/ui'

/**
 * Load documents from localStorage with cleanup
 *
 * Ensures animation states don't persist across sessions:
 * - titleLoading: Reset to prevent phantom loading skeletons
 * - titleJustGenerated: Reset to prevent unwanted fade animations
 */
export const loadDocuments = (): Document[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS)
    if (!stored) return []

    const documents: Document[] = JSON.parse(stored)
    return documents.map(doc => ({
      ...doc,
      // Clean up any animation states that shouldn't persist
      titleLoading: false,
      titleJustGenerated: false
    }))
  } catch (error) {
    console.error('Failed to load documents:', error)
    return []
  }
}

export const saveDocuments = (documents: Document[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents))
  } catch (error) {
    console.error('Failed to save documents:', error)
  }
}

export const loadFolders = (): Folder[] => {
  try {
    // First try to load from current key
    let stored = localStorage.getItem(STORAGE_KEYS.FOLDERS)
    if (stored) {
      return JSON.parse(stored)
    }

    // Migrate from legacy "projects" naming if it exists
    stored = localStorage.getItem(STORAGE_KEYS.OLD_PROJECTS)
    if (stored) {
      const folders = JSON.parse(stored)
      // Save to new key and remove old one
      localStorage.setItem(STORAGE_KEYS.FOLDERS, stored)
      localStorage.removeItem(STORAGE_KEYS.OLD_PROJECTS)
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
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders))
  } catch (error) {
    console.error('Failed to save folders:', error)
  }
}
