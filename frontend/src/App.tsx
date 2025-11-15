import { useState, useRef } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useDocuments, useProjects } from './hooks/useLocalStorage'
import { generateTitle } from './services/api'
import { generateId } from './utils/id'
import type { Document } from './types'

function App() {
  const [documents, setDocuments] = useDocuments()
  const [projects, setProjects] = useProjects()
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [canvasContent, setCanvasContent] = useState('')
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)

  // Track pending title generation to prevent race conditions
  const titleGenerationRef = useRef<string | null>(null)

  const handleSaveDocument = async () => {
    const content = canvasContent.trim()
    if (content.length === 0) return

    const now = Date.now()
    const isUpdate = !!currentDocumentId

    // Determine document ID
    const docId = isUpdate ? currentDocumentId : generateId('doc')

    // Create or update document with loading state
    const newDoc: Document = isUpdate
      ? {
          ...documents.find(d => d.id === docId)!,
          content,
          updatedAt: now,
          title: '',
          titleLoading: true
        }
      : {
          id: docId,
          content,
          title: '',
          createdAt: now,
          updatedAt: now,
          projectId: currentProjectId,
          titleLoading: true
        }

    // Update documents array (single update)
    const updatedDocuments = isUpdate
      ? documents.map(doc => doc.id === docId ? newDoc : doc)
      : [...documents, newDoc]

    setDocuments(updatedDocuments)

    // Clear canvas
    setCanvasContent('')
    setCurrentDocumentId(null)

    // Generate title in background (with race condition protection)
    titleGenerationRef.current = docId
    const title = await generateTitle(content)

    // Only update if this is still the most recent save
    if (titleGenerationRef.current === docId) {
      const finalDocuments = updatedDocuments.map(doc =>
        doc.id === docId ? { ...doc, title, titleLoading: false } : doc
      )
      setDocuments(finalDocuments)
      titleGenerationRef.current = null
    }
  }

  const handleLoadDocument = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    if (doc) {
      setCanvasContent(doc.content)
      setCurrentDocumentId(doc.id)
      // Sync project context to match the document's project
      setCurrentProjectId(doc.projectId)
    }
  }

  const handleProjectClick = (projectId: string | null) => {
    // Clear canvas and document when switching project context
    setCanvasContent('')
    setCurrentDocumentId(null)
    setCurrentProjectId(projectId)
  }

  const handleCreateProject = (name: string) => {
    const now = Date.now()
    const newProject = {
      id: generateId('proj'),
      name,
      createdAt: now,
      updatedAt: now,
    }

    setProjects([...projects, newProject])
    // Clear canvas and set new project context
    setCanvasContent('')
    setCurrentDocumentId(null)
    setCurrentProjectId(newProject.id)
  }

  const handleUpdateProjectName = (projectId: string, newName: string) => {
    const now = Date.now()
    const updatedProjects = projects.map(project =>
      project.id === projectId
        ? { ...project, name: newName, updatedAt: now }
        : project
    )
    setProjects(updatedProjects)
  }

  return (
    <div className="h-screen flex">
      <LeftSidebar
        isExpanded={leftSidebarExpanded}
        onToggle={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        documents={documents}
        projects={projects}
        currentProjectId={currentProjectId}
        onDocumentClick={handleLoadDocument}
        onCreateProject={handleCreateProject}
        onProjectClick={handleProjectClick}
        onUpdateProjectName={handleUpdateProjectName}
      />
      <Canvas
        content={canvasContent}
        onChange={setCanvasContent}
        onSelectionChange={setSelectedText}
        onSave={handleSaveDocument}
      />
      <RightSidebar
        isExpanded={rightSidebarExpanded}
        onToggle={() => setRightSidebarExpanded(!rightSidebarExpanded)}
        selectedText={selectedText}
      />
    </div>
  )
}

export default App
