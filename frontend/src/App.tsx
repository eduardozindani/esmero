import { useState, useEffect, useRef } from 'react'
import LeftSidebar from './components/LeftSidebar'
import Canvas from './components/Canvas'
import RightSidebar from './components/RightSidebar/RightSidebar'
import { useSidebarWidths } from './hooks/useSidebarWidths'
import { useFileSystem } from './contexts/FileSystemContext'
import { getCurrentFolderId } from './utils/folders'
import { SIDEBAR_CONSTRAINTS } from './constants/ui'

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
  const [isMaximizing, setIsMaximizing] = useState(false)
  const [pendingDiffChunks, setPendingDiffChunks] = useState<Array<{
    id: string
    oldText: string
    newText: string
    explanation: string
  }> | null>(null)

  // Stores sidebar state before maximize for clean restoration
  const [preMaximizeState, setPreMaximizeState] = useState<{
    leftExpanded: boolean
    rightExpanded: boolean
    leftWidth: number
    rightWidth: number
  } | null>(null)

  // === DEBUGGING: Track render count and state changes ===
  const renderCount = useRef(0)
  renderCount.current++

  console.log(`[RENDER #${renderCount.current}]`, {
    leftExp: leftSidebarExpanded,
    rightExp: rightSidebarExpanded,
    widths: sidebarWidths,
    isMaximizing,
    preMax: preMaximizeState ? 'saved' : 'null'
  })

  // Track when isMaximizing changes
  useEffect(() => {
    console.log('[EFFECT] isMaximizing changed to:', isMaximizing)
  }, [isMaximizing])

  // Track when widths change
  useEffect(() => {
    console.log('[EFFECT] sidebarWidths changed to:', sidebarWidths)
  }, [sidebarWidths])

  // Track when expanded states change
  useEffect(() => {
    console.log('[EFFECT] leftSidebarExpanded changed to:', leftSidebarExpanded)
  }, [leftSidebarExpanded])

  useEffect(() => {
    console.log('[EFFECT] rightSidebarExpanded changed to:', rightSidebarExpanded)
  }, [rightSidebarExpanded])
  // === END DEBUGGING ===

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
    console.log('=== TOGGLE MAXIMIZE START ===')
    const currentWidth = side === 'left' ? sidebarWidths.left : sidebarWidths.right
    const isMaximized = currentWidth > window.innerWidth * 0.9
    console.log('[TOGGLE] side:', side, 'currentWidth:', currentWidth, 'isMaximized:', isMaximized)

    // Disable transitions during maximize/restore to prevent flickering
    console.log('[TOGGLE] Setting isMaximizing = true')
    setIsMaximizing(true)

    if (isMaximized && preMaximizeState) {
      console.log('[TOGGLE] === RESTORE PATH ===')
      console.log('[TOGGLE] Restoring to:', preMaximizeState)
      // RESTORE: Return to exact pre-maximize state
      setLeftSidebarExpanded(preMaximizeState.leftExpanded)
      setRightSidebarExpanded(preMaximizeState.rightExpanded)
      updateSidebarWidths({
        left: preMaximizeState.leftWidth,
        right: preMaximizeState.rightWidth
      })
      setPreMaximizeState(null)
    } else {
      console.log('[TOGGLE] === MAXIMIZE PATH ===')
      // MAXIMIZE: Save current state first, then maximize
      const stateToSave = {
        leftExpanded: leftSidebarExpanded,
        rightExpanded: rightSidebarExpanded,
        leftWidth: sidebarWidths.left,
        rightWidth: sidebarWidths.right
      }
      console.log('[TOGGLE] Saving state:', stateToSave)
      setPreMaximizeState(stateToSave)

      // When maximizing, the other sidebar is COLLAPSED (width: 0), not MIN_WIDTH
      // So maxWidth = viewport - edge offset (for the resize handle)
      const maxWidth = window.innerWidth - SIDEBAR_CONSTRAINTS.MAXIMIZE_EDGE_OFFSET
      console.log('[TOGGLE] maxWidth:', maxWidth, 'viewport:', window.innerWidth)

      if (side === 'left') {
        console.log('[TOGGLE] Maximizing LEFT, collapsing right')
        // Collapse right sidebar (it will have width: 0 because isExpanded=false)
        setRightSidebarExpanded(false)
        // Only update left width - right sidebar is collapsed so its width doesn't matter
        updateSidebarWidths({ left: maxWidth })
      } else {
        console.log('[TOGGLE] Maximizing RIGHT, collapsing left')
        // Collapse left sidebar (it will have width: 0 because isExpanded=false)
        setLeftSidebarExpanded(false)
        // Only update right width - left sidebar is collapsed so its width doesn't matter
        updateSidebarWidths({ right: maxWidth })
      }
    }

    // Keep transitions disabled - don't re-enable them
    // This is a test to see if transitions are causing the flicker
    console.log('[TOGGLE] Keeping isMaximizing = true (test)')
    console.log('=== TOGGLE MAXIMIZE END (sync) ===')
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
        disableTransitions={isMaximizing}
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
        disableTransitions={isMaximizing}
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
