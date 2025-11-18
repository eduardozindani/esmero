import type { Folder, Document } from '../types'

/**
 * Get immediate child folders of a given folder
 * @param folders All folders in the system
 * @param parentId The parent folder ID (null for root level)
 * @returns Array of immediate child folders
 */
export const getChildFolders = (
  folders: Folder[],
  parentId: string | null
): Folder[] => {
  return folders.filter(folder => folder.parentFolderId === parentId)
}

/**
 * Get all descendant folders recursively
 * @param folders All folders in the system
 * @param folderId The folder ID to get descendants for
 * @returns Array of all descendant folders (children, grandchildren, etc.)
 */
export const getAllDescendantFolders = (
  folders: Folder[],
  folderId: string
): Folder[] => {
  const descendants: Folder[] = []
  const queue = [folderId]

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const children = folders.filter(f => f.parentFolderId === currentId)
    descendants.push(...children)
    queue.push(...children.map(c => c.id))
  }

  return descendants
}

/**
 * Get all documents in a folder and its descendants
 * @param documents All documents in the system
 * @param folders All folders in the system
 * @param folderId The folder ID to get documents for
 * @returns Array of all documents in the folder tree
 */
export const getAllDescendantDocuments = (
  documents: Document[],
  folders: Folder[],
  folderId: string
): Document[] => {
  // Get all descendant folder IDs
  const descendantFolders = getAllDescendantFolders(folders, folderId)
  const allFolderIds = [folderId, ...descendantFolders.map(f => f.id)]

  // Return all documents in these folders
  return documents.filter(doc => doc.folderId && allFolderIds.includes(doc.folderId))
}

/**
 * Delete a folder and all its descendants recursively
 * @param folders All folders in the system
 * @param documents All documents in the system
 * @param folderId The folder ID to delete
 * @returns Updated folders and documents arrays after deletion
 */
export const deleteFolderRecursive = (
  folders: Folder[],
  documents: Document[],
  folderId: string
): { folders: Folder[], documents: Document[] } => {
  // Get all folders to delete (target + descendants)
  const foldersToDelete = getAllDescendantFolders(folders, folderId)
  const folderIdsToDelete = [folderId, ...foldersToDelete.map(f => f.id)]

  // Filter out deleted folders
  const remainingFolders = folders.filter(f => !folderIdsToDelete.includes(f.id))

  // Filter out documents in deleted folders
  const remainingDocuments = documents.filter(
    doc => !doc.folderId || !folderIdsToDelete.includes(doc.folderId)
  )

  return {
    folders: remainingFolders,
    documents: remainingDocuments
  }
}

/**
 * Build the folder path from root to a given folder
 * @param folders All folders in the system
 * @param folderId The target folder ID
 * @returns Array of folder IDs from root to target
 */
export const buildFolderPath = (
  folders: Folder[],
  folderId: string | null
): string[] => {
  if (!folderId) return []

  const path: string[] = []
  let currentId: string | null = folderId

  // Walk up the tree to build path
  while (currentId) {
    path.unshift(currentId)  // Add to beginning
    const folder = folders.find(f => f.id === currentId)
    currentId = folder?.parentFolderId ?? null
  }

  return path
}

/**
 * Get the current folder ID from a folder path
 * @param folderPath The folder path array
 * @returns The current folder ID (last in path) or null if at root
 */
export const getCurrentFolderId = (folderPath: string[]): string | null => {
  return folderPath.length > 0 ? folderPath[folderPath.length - 1] : null
}

/**
 * Navigate back one level in the folder hierarchy
 * @param folderPath Current folder path
 * @returns New folder path after going back
 */
export const navigateBack = (folderPath: string[]): string[] => {
  return folderPath.slice(0, -1)
}