import { useState, useRef } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useDocuments, useFolders } from './hooks/useLocalStorage'
import { useSidebarWidths } from './hooks/useSidebarWidths'
import { generateTitle } from './services/api'
import { generateId } from './utils/id'
import { extractTextFromHTML, isHTMLEmpty } from './utils/html'
import { ANIMATIONS } from './constants/ui'
import { getCurrentFolderId, deleteFolderRecursive, navigateBack } from './utils/folders'
import type { Document } from './types'

function App() {
  const [documents, setDocuments] = useDocuments()
  const [folders, setFolders] = useFolders()
  const [sidebarWidths, updateSidebarWidths] = useSidebarWidths()
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<string[]>([])  // Replace currentFolderId with path
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
  const [focusCanvasTrigger, setFocusCanvasTrigger] = useState(0)

  // Track pending title generation to prevent race conditions
  const titleGenerationRef = useRef<string | null>(null)

  /**
   * Handles document saving with intelligent title generation
   *
   * Behavior:
   * - New documents: Show skeleton loader → Generate title → Fade in animation
   * - Existing documents: Keep old title visible → Generate new title → Fade in animation
   * - Empty canvas: Do nothing
   * - No changes: Clear canvas without saving
   */
  const handleSaveDocument = async () => {
    const content = canvasContent.trim()
    console.log('=== SAVING ===')
    console.log('Raw canvasContent:', canvasContent)
    console.log('Trimmed content:', content)

    // Don't save empty documents
    if (isHTMLEmpty(content)) return

    const now = Date.now()
    const isUpdate = !!currentDocumentId

    // Check if document actually changed (compare text content and folder location)
    let contentChanged = false
    if (isUpdate) {
      const existingDoc = documents.find(d => d.id === currentDocumentId)
      if (existingDoc) {
        const currentText = extractTextFromHTML(content)
        const existingText = extractTextFromHTML(existingDoc.content)
        contentChanged = currentText !== existingText
        const folderChanged = existingDoc.folderId !== getCurrentFolderId(folderPath)

        if (!contentChanged && !folderChanged) {
          // No actual changes (content or folder) - just clear the canvas
          setCanvasContent('')
          setCurrentDocumentId(null)
          return
        }
      }
    }

    // Create or update the document
    const docId = isUpdate ? currentDocumentId : generateId('doc')
    const existingDoc = documents.find(d => d.id === docId)

    const newDoc: Document = isUpdate && existingDoc
      ? {
          ...existingDoc,
          content,
          updatedAt: now,
          folderId: getCurrentFolderId(folderPath),  // Update folder location - document moves to current context
          // For updates: preserve existing title, no loading state
        }
      : {
          // For new documents: start with loading and appearance animation
          id: docId,
          content,
          title: '',
          createdAt: now,
          updatedAt: now,
          folderId: getCurrentFolderId(folderPath),
          titleLoading: true,
          documentJustCreated: true
        }

    // Save document immediately
    const updatedDocuments = isUpdate
      ? documents.map(doc => doc.id === docId ? newDoc : doc)
      : [...documents, newDoc]

    setDocuments(updatedDocuments)

    // Clear canvas for next document
    setCanvasContent('')
    setCurrentDocumentId(null)

    // Request canvas focus for new document
    setFocusCanvasTrigger(prev => prev + 1)

    // --- Title Generation (async, non-blocking) ---
    // Only regenerate title if content changed OR it's a new document
    const shouldRegenerateTitle = !isUpdate || contentChanged

    if (shouldRegenerateTitle) {
      // Mark this document as having pending title generation
      titleGenerationRef.current = docId

      // For new documents only: Set timeout to remove skeleton if generation fails
      const timeoutId = !isUpdate ? setTimeout(() => {
        if (titleGenerationRef.current === docId) {
          // Generation timed out - remove loading state
          setDocuments((prev: Document[]) => prev.map((doc: Document) =>
            doc.id === docId ? { ...doc, titleLoading: false } : doc
          ))
          titleGenerationRef.current = null
        }
      }, ANIMATIONS.TITLE_GENERATION_TIMEOUT) : null

      // Generate title with LLM
      const title = await generateTitle(content)

      // Clear timeout if it exists
      if (timeoutId) clearTimeout(timeoutId)

      // Only apply title if this is still the most recent generation
      // (prevents race conditions when multiple saves happen quickly)
      if (titleGenerationRef.current === docId) {
        // Apply new title with fade-in animation flag
        const finalDocuments = updatedDocuments.map(doc =>
          doc.id === docId
            ? { ...doc, title, titleLoading: false, titleJustGenerated: true }
            : doc
        )
        setDocuments(finalDocuments)
        titleGenerationRef.current = null

        // Remove animation flags after animation completes
        setTimeout(() => {
          setDocuments((prev: Document[]) => prev.map((doc: Document) =>
            doc.id === docId ? { ...doc, titleJustGenerated: false, documentJustCreated: false } : doc
          ))
        }, ANIMATIONS.TITLE_FADE_IN)
      }
    }
  }

  const handleLoadDocument = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId)
    if (doc) {
      console.log('=== LOADING ===')
      console.log('Document content:', doc.content)
      console.log('Content length:', doc.content.length)
      setCanvasContent(doc.content)
      setCurrentDocumentId(doc.id)
      // Keep current folder context - document will move to this folder on save
      // Request canvas focus
      setFocusCanvasTrigger(prev => prev + 1)
    }
  }

  const handleFolderClick = (folderId: string | null) => {
    // Navigate to folder by setting the path
    if (folderId) {
      // Push folder to path (going deeper)
      setFolderPath(prev => [...prev, folderId])
    } else {
      // Go to root (clear path)
      setFolderPath([])
    }
    // Request canvas focus
    setFocusCanvasTrigger(prev => prev + 1)
  }

  const handleNavigateBack = () => {
    // Go back one level in folder hierarchy
    setFolderPath(prev => navigateBack(prev))
    // Request canvas focus
    setFocusCanvasTrigger(prev => prev + 1)
  }

  const handleCreateFolder = (name: string) => {
    const now = Date.now()
    const currentFolderId = getCurrentFolderId(folderPath)
    const newFolder = {
      id: generateId('folder'),
      name,
      parentFolderId: currentFolderId,  // New folder is child of current folder
      createdAt: now,
      updatedAt: now,
    }

    setFolders([...folders, newFolder])
    // Navigate into the new folder
    setFolderPath(prev => [...prev, newFolder.id])
    // Request canvas focus
    setFocusCanvasTrigger(prev => prev + 1)
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

  const handleDeleteCurrentDocument = () => {
    // Only delete if there's a current document loaded
    if (currentDocumentId) {
      // Set deleting flag to trigger animation
      setDocuments((prev: Document[]) => prev.map((doc: Document) =>
        doc.id === currentDocumentId ? { ...doc, documentDeleting: true } : doc
      ))

      // Wait for animation to complete, then actually delete
      setTimeout(() => {
        handleDeleteDocument(currentDocumentId)
        // Canvas is already cleared by handleDeleteDocument
        // Request canvas focus for new document
        setFocusCanvasTrigger(prev => prev + 1)
      }, ANIMATIONS.DOCUMENT_SLIDE_OUT)
    } else {
      // No document loaded, just clear the canvas (was typing a new doc)
      setCanvasContent('')
      setFocusCanvasTrigger(prev => prev + 1)
    }
  }

  const handleDeleteFolder = (folderId: string) => {
    // Use recursive delete to remove folder and all descendants
    const { folders: updatedFolders, documents: updatedDocuments } = deleteFolderRecursive(
      folders,
      documents,
      folderId
    )
    setFolders(updatedFolders)
    setDocuments(updatedDocuments)

    // If we're currently inside the deleted folder or its descendants, navigate to parent
    if (folderPath.includes(folderId)) {
      // Find the path up to (but not including) the deleted folder
      const indexOfDeleted = folderPath.indexOf(folderId)
      setFolderPath(folderPath.slice(0, indexOfDeleted))
    }
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
        rightSidebarWidth={rightSidebarExpanded ? sidebarWidths.right : 0}
        documents={documents}
        folders={folders}
        folderPath={folderPath}
        onDocumentClick={handleLoadDocument}
        onCreateFolder={handleCreateFolder}
        onFolderClick={handleFolderClick}
        onNavigateBack={handleNavigateBack}
        onUpdateFolderName={handleUpdateFolderName}
        onDeleteDocument={handleDeleteDocument}
        onDeleteFolder={handleDeleteFolder}
      />
      <Canvas
        content={canvasContent}
        onChange={setCanvasContent}
        onSelectionChange={setSelectedText}
        onSave={handleSaveDocument}
        onDelete={handleDeleteCurrentDocument}
        pendingDiffChunks={pendingDiffChunks}
        onAcceptChunk={handleAcceptChunk}
        onRejectChunk={handleRejectChunk}
        onRejectAllDiffs={handleRejectAllDiffs}
        focusTrigger={focusCanvasTrigger}
      />
      <RightSidebar
        isExpanded={rightSidebarExpanded}
        onToggle={() => setRightSidebarExpanded(!rightSidebarExpanded)}
        width={sidebarWidths.right}
        onResize={(width) => updateSidebarWidths({ right: width })}
        leftSidebarWidth={leftSidebarExpanded ? sidebarWidths.left : 0}
        selectedText={selectedText}
        canvasContent={canvasContent}
        currentDocumentId={currentDocumentId}
        currentFolderId={getCurrentFolderId(folderPath)}
        documents={documents}
        folders={folders}
        onDiffReceived={setPendingDiffChunks}
      />
    </div>
  )
}

export default App
