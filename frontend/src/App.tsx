import { useState, useRef } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useDocuments, useFolders } from './hooks/useLocalStorage'
import { useSidebarWidths } from './hooks/useSidebarWidths'
import { generateTitle } from './services/api'
import { generateId } from './utils/id'
import { extractTextFromHTML, isHTMLEmpty } from './utils/html'
import type { Document } from './types'

function App() {
  const [documents, setDocuments] = useDocuments()
  const [folders, setFolders] = useFolders()
  const [sidebarWidths, updateSidebarWidths] = useSidebarWidths()
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [canvasContent, setCanvasContent] = useState('')
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const [pendingDiffChunks, setPendingDiffChunks] = useState<Array<{
    id: string
    oldText: string
    newText: string
    explanation: string
  }> | null>(null)

  // Track pending title generation to prevent race conditions
  const titleGenerationRef = useRef<string | null>(null)

  const handleSaveDocument = async () => {
    const content = canvasContent.trim()

    // Issue 2: If canvas is empty (no text content), just do nothing
    if (isHTMLEmpty(content)) return

    const now = Date.now()
    const isUpdate = !!currentDocumentId

    // Issue 1: If loading existing document without changes (compare text, not HTML), just clear canvas
    if (isUpdate) {
      const existingDoc = documents.find(d => d.id === currentDocumentId)
      if (existingDoc) {
        const currentText = extractTextFromHTML(content)
        const existingText = extractTextFromHTML(existingDoc.content)
        if (currentText === existingText) {
          // No changes made, just clear canvas
          setCanvasContent('')
          setCurrentDocumentId(null)
          return
        }
      }
    }

    // Determine document ID
    const docId = isUpdate ? currentDocumentId : generateId('doc')

    // Create or update document
    // For updates: keep existing title, don't show loading skeleton
    // For new docs: show loading skeleton
    const existingDoc = documents.find(d => d.id === docId)
    const newDoc: Document = isUpdate && existingDoc
      ? {
          ...existingDoc,
          content,
          updatedAt: now,
          // Keep existing title, no loading state for updates
        }
      : {
          id: docId,
          content,
          title: '',
          createdAt: now,
          updatedAt: now,
          folderId: currentFolderId,
          titleLoading: true  // Only show skeleton for new documents
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

    // Set a timeout to clean up loading state if title generation takes too long
    // Only for new documents that have skeleton loading state
    const timeoutId = !isUpdate ? setTimeout(() => {
      // If this document is still loading after 10 seconds, clean it up
      if (titleGenerationRef.current === docId) {
        setDocuments(prev => prev.map(doc =>
          doc.id === docId ? { ...doc, titleLoading: false } : doc
        ))
        titleGenerationRef.current = null
      }
    }, 10000) : null // 10 second timeout only for new documents

    const title = await generateTitle(content)

    // Clear the timeout since we got a response (if it exists)
    if (timeoutId) clearTimeout(timeoutId)

    // Only update if this is still the most recent save
    if (titleGenerationRef.current === docId) {
      const finalDocuments = updatedDocuments.map(doc =>
        doc.id === docId ? { ...doc, title, titleLoading: false, titleJustGenerated: true } : doc
      )
      setDocuments(finalDocuments)
      titleGenerationRef.current = null

      // Clear the "just generated" flag after animation completes (300ms)
      setTimeout(() => {
        setDocuments(prev => prev.map(doc =>
          doc.id === docId ? { ...doc, titleJustGenerated: false } : doc
        ))
      }, 300)
    }
  }

  const handleLoadDocument = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    if (doc) {
      setCanvasContent(doc.content)
      setCurrentDocumentId(doc.id)
      // Sync folder context to match the document's folder
      setCurrentFolderId(doc.folderId)
    }
  }

  const handleFolderClick = (folderId: string | null) => {
    // Clear canvas and document when switching folder context
    setCanvasContent('')
    setCurrentDocumentId(null)
    setCurrentFolderId(folderId)
  }

  const handleCreateFolder = (name: string) => {
    const now = Date.now()
    const newFolder = {
      id: generateId('folder'),
      name,
      createdAt: now,
      updatedAt: now,
    }

    setFolders([...folders, newFolder])
    // Clear canvas and set new folder context
    setCanvasContent('')
    setCurrentDocumentId(null)
    setCurrentFolderId(newFolder.id)
  }

  const handleUpdateFolderName = (folderId: string, newName: string) => {
    const now = Date.now()
    const updatedFolders = folders.map(folder =>
      folder.id === folderId
        ? { ...folder, name: newName, updatedAt: now }
        : folder
    )
    setFolders(updatedFolders)
  }

  const handleDeleteDocument = (documentId: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId)
    setDocuments(updatedDocuments)
    // If we're currently viewing this document, clear the canvas
    if (currentDocumentId === documentId) {
      setCanvasContent('')
      setCurrentDocumentId(null)
    }
  }

  const handleDeleteFolder = (folderId: string) => {
    // Delete the folder
    const updatedFolders = folders.filter(f => f.id !== folderId)
    setFolders(updatedFolders)
    // Delete all documents in this folder
    const updatedDocuments = documents.filter(doc => doc.folderId !== folderId)
    setDocuments(updatedDocuments)
  }

  const handleAcceptChunk = (chunkId: string) => {
    if (!pendingDiffChunks) return

    const chunk = pendingDiffChunks.find(c => c.id === chunkId)
    if (!chunk) return

    // Note: The actual text replacement happens in Canvas via TipTap editor
    // This callback is just for state management
    // Canvas component will handle the editor manipulation

    // Remove this chunk from pending
    const remaining = pendingDiffChunks.filter(c => c.id !== chunkId)
    setPendingDiffChunks(remaining.length > 0 ? remaining : null)
  }

  const handleRejectChunk = (chunkId: string) => {
    if (!pendingDiffChunks) return

    // Remove this chunk from pending
    const remaining = pendingDiffChunks.filter(c => c.id !== chunkId)
    setPendingDiffChunks(remaining.length > 0 ? remaining : null)
  }

  const handleRejectAllDiffs = () => {
    setPendingDiffChunks(null)
  }

  return (
    <div className="h-screen flex">
      <LeftSidebar
        isExpanded={leftSidebarExpanded}
        onToggle={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        width={sidebarWidths.left}
        onResize={(width) => updateSidebarWidths({ left: width })}
        documents={documents}
        folders={folders}
        currentFolderId={currentFolderId}
        onDocumentClick={handleLoadDocument}
        onCreateFolder={handleCreateFolder}
        onFolderClick={handleFolderClick}
        onUpdateFolderName={handleUpdateFolderName}
        onDeleteDocument={handleDeleteDocument}
        onDeleteFolder={handleDeleteFolder}
      />
      <Canvas
        content={canvasContent}
        onChange={setCanvasContent}
        onSelectionChange={setSelectedText}
        onSave={handleSaveDocument}
        pendingDiffChunks={pendingDiffChunks}
        onAcceptChunk={handleAcceptChunk}
        onRejectChunk={handleRejectChunk}
        onRejectAllDiffs={handleRejectAllDiffs}
      />
      <RightSidebar
        isExpanded={rightSidebarExpanded}
        onToggle={() => setRightSidebarExpanded(!rightSidebarExpanded)}
        width={sidebarWidths.right}
        onResize={(width) => updateSidebarWidths({ right: width })}
        selectedText={selectedText}
        canvasContent={canvasContent}
        currentDocumentId={currentDocumentId}
        currentFolderId={currentFolderId}
        documents={documents}
        folders={folders}
        onDiffReceived={setPendingDiffChunks}
      />
    </div>
  )
}

export default App
