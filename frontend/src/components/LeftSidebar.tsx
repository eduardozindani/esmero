import { useState, useEffect, useRef } from 'react'
import type { Document, Folder } from '../types'
import { getCurrentFolderId, getChildFolders, getAllDescendantFolders, getAllDescendantDocuments } from '../utils/folders'
import FolderClosed from './icons/FolderClosed'
import FolderOpen from './icons/FolderOpen'
import DocumentIcon from './icons/DocumentIcon'
import ResizeHandle from './ResizeHandle'
import { useAutoAnimate } from '@formkit/auto-animate/react'

interface LeftSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  width: number
  onResize: (width: number) => void
  onMaximize?: () => void
  rightSidebarWidth: number
  documents: Document[]
  folders: Folder[]
  folderPath: string[]
  onDocumentClick: (documentId: string) => void
  onCreateFolder: (name: string) => void
  onFolderClick: (folderId: string | null) => void
  onNavigateBack: () => void
  onUpdateFolderName: (folderId: string, newName: string) => void
  onUpdateDocumentTitle: (documentId: string, newTitle: string) => void
  onDeleteDocument: (documentId: string) => void
  onDeleteFolder: (folderId: string) => void
  onNewDocument: () => void
  currentDocumentId: string | null
}

function LeftSidebar({
  isExpanded,
  onToggle,
  width,
  onResize,
  onMaximize,
  rightSidebarWidth,
  documents,
  folders,
  folderPath,
  onDocumentClick,
  onCreateFolder,
  onFolderClick,
  onNavigateBack,
  onUpdateFolderName,
  onUpdateDocumentTitle,
  onDeleteDocument,
  onDeleteFolder,
  onNewDocument,
  currentDocumentId
}: LeftSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [editingFolderName, setEditingFolderName] = useState(false)
  const [editedName, setEditedName] = useState('')
  
  // Document renaming state
  const [renamingDocumentId, setRenamingDocumentId] = useState<string | null>(null)
  const [renamingDocumentTitle, setRenamingDocumentTitle] = useState('')

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId?: string; documentId?: string } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  
  // New state for pending folder creation
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('New Folder')
  const newFolderInputRef = useRef<HTMLInputElement>(null)
  
  // Animate the list of documents/folders automatically
  const [listParent] = useAutoAnimate()

  // Focus and select input when entering creation mode
  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus()
      newFolderInputRef.current.select()
    }
  }, [isCreatingFolder])

  // Get current folder ID from path
  const currentFolderId = getCurrentFolderId(folderPath)

  const handleCreateFolderStart = () => {
    setIsCreatingFolder(true)
    setNewFolderName('New Folder')
  }

  const handleCreateFolderConfirm = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
    }
    setIsCreatingFolder(false)
  }

  const handleDeleteFolder = (folderId: string) => {
    onDeleteFolder(folderId)
    setFolderToDelete(null)
    setContextMenu(null)
  }

  const handleDeleteDocument = (documentId: string) => {
    onDeleteDocument(documentId)
    setContextMenu(null)
  }

  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  useEffect(() => {
    // Reset triggers when expansion state changes
    setShowOpenTrigger(false)
    setShowCloseTrigger(false)
  }, [isExpanded])

  // Filter documents and folders for current level
  const filteredDocuments = documents.filter(doc => doc.folderId === currentFolderId)
  const childFolders = getChildFolders(folders, currentFolderId)

  const sortedDocuments = [...filteredDocuments].sort((a, b) => b.updatedAt - a.updatedAt)
  const sortedChildFolders = [...childFolders].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <>
      {/* Collapsed state: hover trigger to open */}
      {!isExpanded && (
        <div
          onClick={onToggle}
          className="fixed left-0 top-1/2 -translate-y-1/2 h-2/5 w-20 z-10 cursor-pointer"
          onMouseEnter={() => setShowOpenTrigger(true)}
          onMouseLeave={() => setShowOpenTrigger(false)}
        >
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2
                       bg-gray-800/20 backdrop-blur-sm
                       h-16 w-8 rounded-r-lg
                       flex items-center justify-center
                       text-gray-600
                       transition-opacity duration-300 pointer-events-none
                       ${showOpenTrigger ? 'opacity-100' : 'opacity-0'}`}
          >
            →
          </div>
        </div>
      )}

      {/* Expanded state: full sidebar */}
      <div
        className={`
          bg-gray-50 border-r border-gray-200 relative flex flex-col
          ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}
          ${isExpanded ? '' : 'w-0 overflow-hidden border-0'}
        `}
        style={{ width: isExpanded ? `${width}px` : 0 }}
      >
        {isExpanded && (
          <>
            {/* Resize handle */}
            <ResizeHandle
              side="left"
              onResize={onResize}
              onMaximize={onMaximize}
              currentWidth={width}
              otherSidebarWidth={rightSidebarWidth}
              onResizeStart={() => setIsResizing(true)}
              onResizeEnd={() => setIsResizing(false)}
            />

            {/* Close trigger strip - Only in centered vertical region */}
            {!isResizing && (
              <div
                onClick={onToggle}
                className="absolute -right-10 top-1/2 -translate-y-1/2 h-2/5 w-20 z-20 cursor-pointer"
                onMouseEnter={() => setShowCloseTrigger(true)}
                onMouseLeave={() => setShowCloseTrigger(false)}
              >
                <div
                  className={`absolute right-10 top-1/2 -translate-y-1/2
                             bg-gray-800/20 backdrop-blur-sm
                             h-16 w-8 rounded-l-lg
                             flex items-center justify-center
                             text-gray-600
                             transition-opacity duration-300 pointer-events-none
                             ${showCloseTrigger ? 'opacity-100' : 'opacity-0'}`}
              >
                ←
              </div>
            </div>
            )}

            <div className="flex flex-col h-full p-4">
              {/* Global Actions: New Folder / New Document - Always visible at top */}
              <div className="mb-4 space-y-1">
                {isCreatingFolder ? (
                  <div className="flex items-center gap-2 p-2 rounded cursor-pointer">
                    <FolderOpen className="flex-shrink-0 text-gray-600" />
                    <input
                      ref={newFolderInputRef}
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateFolderConfirm()
                        } else if (e.key === 'Escape') {
                          setIsCreatingFolder(false)
                        }
                      }}
                      onBlur={handleCreateFolderConfirm}
                      className="flex-1 min-w-0 text-sm text-gray-800 font-bold bg-transparent focus:outline-none -ml-[1px]"
                    />
                  </div>
                ) : (
                  <div
                    onClick={handleCreateFolderStart}
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                  >
                    <span className="flex-shrink-0 text-gray-600 text-sm">+</span>
                    <p className="text-sm text-gray-600 font-bold">New Folder</p>
                  </div>
                )}

                {/* New Document Button */}
                <div
                  onClick={onNewDocument}
                  className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                >
                  <span className="flex-shrink-0 text-gray-600 text-sm">+</span>
                  <p className="text-sm text-gray-600 font-bold">New Document</p>
                </div>
              </div>

              {/* Navigation Header - Only when deep in a folder */}
              {currentFolderId && (
                <div className="mb-4">
                  {editingFolderName ? (
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <FolderOpen className="flex-shrink-0 text-gray-600" />
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateFolderName(currentFolderId, editedName)
                            setEditingFolderName(false)
                          } else if (e.key === 'Escape') {
                            setEditingFolderName(false)
                          }
                        }}
                        onBlur={() => setEditingFolderName(false)}
                        autoFocus
                        className="flex-1 min-w-0 text-lg font-bold px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        onClick={onNavigateBack}
                        className="flex-shrink-0 text-gray-600 cursor-pointer hover:text-gray-800 transition px-2 py-1"
                      >
                        ←
                      </span>
                      <div
                        onClick={() => {
                          const folder = folders.find(f => f.id === currentFolderId)
                          if (folder) {
                            setEditedName(folder.name)
                            setEditingFolderName(true)
                          }
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition flex-1 min-w-0"
                      >
                        <FolderOpen className="flex-shrink-0 text-gray-600" />
                        <h2 className="text-lg font-bold truncate">
                          {folders.find(f => f.id === currentFolderId)?.name || 'Untitled'}
                        </h2>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content List */}
              {/* Folders Section - show child folders at any level */}
              {sortedChildFolders.length > 0 && (
                <div className="mb-4">
                  {sortedChildFolders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => onFolderClick(folder.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setContextMenu({ x: e.clientX, y: e.clientY, folderId: folder.id })
                      }}
                      className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition"
                    >
                      <FolderClosed className="flex-shrink-0 text-gray-600" />
                      <p className="text-sm text-gray-800 font-bold truncate">
                        {folder.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Section */}
              <div className="flex-1 overflow-y-auto">
                <div ref={listParent}>
                  {sortedDocuments.map(doc => (
                    <div
                      key={doc.id}
                    onClick={() => {
                      if (currentDocumentId === doc.id) {
                        setRenamingDocumentId(doc.id)
                        setRenamingDocumentTitle(doc.title)
                      } else {
                        onDocumentClick(doc.id)
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({ x: e.clientX, y: e.clientY, documentId: doc.id })
                    }}
                    className={`flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition ${
                      currentDocumentId === doc.id ? 'bg-gray-200' : ''
                    }`}
                  >
                    <DocumentIcon className="flex-shrink-0 text-gray-600" />
                    {renamingDocumentId === doc.id ? (
                      <input
                        type="text"
                        value={renamingDocumentTitle}
                        onChange={(e) => setRenamingDocumentTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (renamingDocumentTitle.trim() && renamingDocumentTitle.trim() !== doc.title) {
                              onUpdateDocumentTitle(doc.id, renamingDocumentTitle.trim())
                            }
                            setRenamingDocumentId(null)
                          } else if (e.key === 'Escape') {
                            setRenamingDocumentId(null)
                          }
                        }}
                        onBlur={() => {
                          if (renamingDocumentTitle.trim() && renamingDocumentTitle.trim() !== doc.title) {
                            onUpdateDocumentTitle(doc.id, renamingDocumentTitle.trim())
                          }
                          setRenamingDocumentId(null)
                        }}
                        autoFocus
                        onFocus={(e) => e.target.select()}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 min-w-0 text-sm text-gray-800 font-bold bg-transparent focus:outline-none -ml-[1px]"
                      />
                    ) : (
                      <>
                        {doc.titleLoading ? (
                          <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse" />
                        ) : (
                          <p 
                            key={`${doc.id}-${doc.title}`}
                            className={`text-sm text-gray-800 truncate ${doc.titleJustGenerated ? 'animate-fadeIn' : ''}`}
                          >
                            {doc.title || 'Untitled'}
                          </p>
                        )}
                      </>
                    )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Context Menu */}
              {contextMenu && (
                <div
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      if (contextMenu.folderId) {
                        const allDocs = getAllDescendantDocuments(documents, folders, contextMenu.folderId)
                        if (allDocs.length > 0) {
                          setFolderToDelete(contextMenu.folderId)
                        } else {
                          handleDeleteFolder(contextMenu.folderId)
                        }
                      } else if (contextMenu.documentId) {
                        handleDeleteDocument(contextMenu.documentId)
                      }
                    }}
                    className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {/* Delete Folder Confirmation Modal */}
            {folderToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setFolderToDelete(null)}>
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-2">Delete Folder?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {(() => {
                      const folderName = folders.find(f => f.id === folderToDelete)?.name
                      const descendantFolders = getAllDescendantFolders(folders, folderToDelete)
                      const allDocs = getAllDescendantDocuments(documents, folders, folderToDelete)

                      if (descendantFolders.length > 0) {
                        return `This will delete "${folderName}" and ${descendantFolders.length} subfolder${descendantFolders.length === 1 ? '' : 's'}, containing ${allDocs.length} document${allDocs.length === 1 ? '' : 's'} total.`
                      } else {
                        return `This will delete "${folderName}" and the ${allDocs.length} document${allDocs.length === 1 ? '' : 's'} inside.`
                      }
                    })()}
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setFolderToDelete(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteFolder(folderToDelete)}
                      className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default LeftSidebar
