import type { Document, Folder } from '../types'
import { STORAGE_KEYS } from '../constants/ui'

/**
 * Load documents from localStorage with cleanup
 *
 * Ensures animation states don't persist across sessions:
 * - titleLoading: Reset to prevent phantom loading skeletons
 * - titleJustGenerated: Reset to prevent unwanted fade animations
 * - documentJustCreated: Reset to prevent unwanted slide-in animations
 * - documentDeleting: Reset to prevent stuck deletion states
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
      titleJustGenerated: false,
      documentJustCreated: false,
      documentDeleting: false
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
      const folders: Folder[] = JSON.parse(stored)
      // Migrate folders that don't have parentFolderId (from old version)
      const migrated = folders.map(folder => ({
        ...folder,
        parentFolderId: folder.parentFolderId ?? null  // Add null if missing
      }))
      // Save migrated version if any changes were made
      if (folders.some(f => !('parentFolderId' in f))) {
        localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(migrated))
      }
      return migrated
    }

    // Migrate from legacy "projects" naming if it exists
    stored = localStorage.getItem(STORAGE_KEYS.OLD_PROJECTS)
    if (stored) {
      const folders: Folder[] = JSON.parse(stored)
      // Add parentFolderId to legacy folders
      const migrated = folders.map(folder => ({
        ...folder,
        parentFolderId: null  // All legacy folders become root level
      }))
      // Save to new key with migration and remove old one
      localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(migrated))
      localStorage.removeItem(STORAGE_KEYS.OLD_PROJECTS)
      return migrated
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
