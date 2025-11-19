import { useState } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useSidebarWidths } from './hooks/useSidebarWidths'
import { useFileSystem } from './contexts/FileSystemContext'
import { getCurrentFolderId } from './utils/folders'

function App() {
  const {
    documents,
    folders,
    currentDocumentId,
    folderPath,
    canvasContent,
    focusCanvasTrigger,
    loadDocument,
    saveDocument,
    deleteDocument,
    deleteCurrentDocument,
    createFolder,
    deleteFolder,
    updateFolderName,
    updateDocumentTitle,
    navigateToFolder,
    navigateBack,
    setCanvasContent,
    startNewDocument
  } = useFileSystem()

  const [sidebarWidths, updateSidebarWidths] = useSidebarWidths()
  const [selectedText, setSelectedText] = useState<string | null>(null)
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(false)
  const [rightSidebarExpanded, setRightSidebarExpanded] = useState(false)
  const [pendingDiffChunks, setPendingDiffChunks] = useState<Array<{
    id: string
    oldText: string
    newText: string
    explanation: string
  }> | null>(null)

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

  const toggleSidebarMaximize = (side: 'left' | 'right') => {
    const isMaximized = (side === 'left' ? sidebarWidths.left : sidebarWidths.right) > window.innerWidth * 0.9
    
    if (isMaximized) {
      // Restore to default
      // Ideally we would restore to previous width, but for now we can restore to default
      updateSidebarWidths({
        [side]: side === 'left' ? 256 : 384
      })
      
      // Optional: re-open the other sidebar if it was closed?
      // We can't know if it was open before, so let's leave it as is or maybe open it if it was likely open.
      // For simplicity, just restore current sidebar width.
    } else {
      // Maximize
      if (side === 'left') {
        setRightSidebarExpanded(false)
        updateSidebarWidths({ left: window.innerWidth })
      } else {
        setLeftSidebarExpanded(false)
        updateSidebarWidths({ right: window.innerWidth })
      }
    }
  }

  return (
    <div className="h-screen flex">
      <LeftSidebar
        isExpanded={leftSidebarExpanded}
        onToggle={() => setLeftSidebarExpanded(!leftSidebarExpanded)}
        width={sidebarWidths.left}
        onResize={(width) => updateSidebarWidths({ left: width })}
        onMaximize={() => toggleSidebarMaximize('left')}
        rightSidebarWidth={rightSidebarExpanded ? sidebarWidths.right : 0}
        currentDocumentId={currentDocumentId}
        documents={documents}
        folders={folders}
        folderPath={folderPath}
        onDocumentClick={loadDocument}
        onCreateFolder={createFolder}
        onFolderClick={navigateToFolder}
        onNavigateBack={navigateBack}
        onUpdateFolderName={updateFolderName}
        onUpdateDocumentTitle={updateDocumentTitle}
        onDeleteDocument={deleteDocument}
        onDeleteFolder={deleteFolder}
        onNewDocument={startNewDocument}
      />
      <Canvas
        content={canvasContent}
        onChange={setCanvasContent}
        onSelectionChange={setSelectedText}
        onSave={() => {
          saveDocument(canvasContent)
          startNewDocument()
        }}
        onDelete={deleteCurrentDocument}
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
        onMaximize={() => toggleSidebarMaximize('right')}
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
