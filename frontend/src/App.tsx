import { useState } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useDocuments, useProjects } from './hooks/useLocalStorage'
import { generateTitle } from './services/api'
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

  const handleSaveDocument = async () => {
    const content = canvasContent.trim()
    if (content.length === 0) return

    const now = Date.now()

    if (currentDocumentId) {
      // Update existing document
      const updatedDocuments = documents.map(doc =>
        doc.id === currentDocumentId
          ? { ...doc, content, updatedAt: now, title: '' }
          : doc
      )
      setDocuments(updatedDocuments)

      // Clear canvas and reset state
      setCanvasContent('')
      setCurrentDocumentId(null)

      // Generate title in background
      const title = await generateTitle(content)
      const finalDocuments = updatedDocuments.map(doc =>
        doc.id === currentDocumentId
          ? { ...doc, title }
          : doc
      )
      setDocuments(finalDocuments)
    } else {
      // Create new document
      const newDoc: Document = {
        id: `doc-${now}`,
        content,
        title: '',
        createdAt: now,
        updatedAt: now,
        projectId: currentProjectId,
      }

      const updatedDocuments = [...documents, newDoc]
      setDocuments(updatedDocuments)

      // Clear canvas
      setCanvasContent('')

      // Generate title in background
      const title = await generateTitle(content)
      const finalDocuments = updatedDocuments.map(doc =>
        doc.id === newDoc.id
          ? { ...doc, title }
          : doc
      )
      setDocuments(finalDocuments)
    }
  }

  const handleLoadDocument = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    if (doc) {
      setCanvasContent(doc.content)
      setCurrentDocumentId(doc.id)
    }
  }

  const handleCreateProject = (name: string) => {
    const now = Date.now()
    const newProject = {
      id: `proj-${now}`,
      name,
      createdAt: now,
      updatedAt: now,
    }

    setProjects([...projects, newProject])
    setCurrentProjectId(newProject.id)
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
        onProjectClick={setCurrentProjectId}
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
