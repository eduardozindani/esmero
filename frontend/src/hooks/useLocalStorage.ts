import { useState, useEffect } from 'react'
import type { Document, Folder } from '../types'
import { loadDocuments, saveDocuments, loadFolders, saveFolders } from '../utils/storage'

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([])

  useEffect(() => {
    setDocuments(loadDocuments())
  }, [])

  const updateDocuments = (newDocuments: Document[]) => {
    setDocuments(newDocuments)
    saveDocuments(newDocuments)
  }

  return [documents, updateDocuments] as const
}

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([])

  useEffect(() => {
    setFolders(loadFolders())
  }, [])

  const updateFolders = (newFolders: Folder[]) => {
    setFolders(newFolders)
    saveFolders(newFolders)
  }

  return [folders, updateFolders] as const
}
