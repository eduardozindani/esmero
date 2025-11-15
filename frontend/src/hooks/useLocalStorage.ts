import { useState, useEffect } from 'react'
import type { Document, Project } from '../types'
import { loadDocuments, saveDocuments, loadProjects, saveProjects } from '../utils/storage'

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

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    setProjects(loadProjects())
  }, [])

  const updateProjects = (newProjects: Project[]) => {
    setProjects(newProjects)
    saveProjects(newProjects)
  }

  return [projects, updateProjects] as const
}
