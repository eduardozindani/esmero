import { useState, useEffect } from 'react'
import type { Document, Folder } from '../types'
import { getCurrentFolderId, getChildFolders, getAllDescendantFolders, getAllDescendantDocuments } from '../utils/folders'
import FolderClosed from './icons/FolderClosed'
import FolderOpen from './icons/FolderOpen'
import DocumentIcon from './icons/DocumentIcon'
import ResizeHandle from './ResizeHandle'

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
  onDeleteDocument: (documentId: string) => void
  onDeleteFolder: (folderId: string) => void
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
  onDeleteDocument,
  onDeleteFolder
}: LeftSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [editingFolderName, setEditingFolderName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId?: string; documentId?: string } | null>(null)
  const [isResizing, setIsResizing] = useState(false)

  // Get current folder ID from path
  const currentFolderId = getCurrentFolderId(folderPath)

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
          className="fixed left-0 top-0 h-full w-20 z-10 cursor-pointer"
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

            {/* Close trigger strip spanning both sides of division */}
            {!isResizing && (
              <div
                onClick={onToggle}
                className="absolute -right-10 top-0 h-full w-20 z-20 cursor-pointer"
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
              {/* New Folder - only show when NOT in a folder */}
              {!currentFolderId && (
                <div className="mb-4">
                  <div
                    onClick={() => onCreateFolder('New Folder')}
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                  >
                    <span className="flex-shrink-0 text-gray-600 text-sm">+</span>
                    <p className="text-sm text-gray-600 font-bold">New Folder</p>
                  </div>
                </div>
              )}

              {/* Folder name header when inside a folder */}
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

                  {/* New Folder button when inside a folder (below header) */}
                  <div className="mt-2">
                    <div
                      onClick={() => onCreateFolder('New Folder')}
                      className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                    >
                      <span className="flex-shrink-0 text-gray-600 text-sm">+</span>
                      <p className="text-sm text-gray-600 font-bold">New Folder</p>
                    </div>
                  </div>
                </div>
              )}

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
                {sortedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => onDocumentClick(doc.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setContextMenu({ x: e.clientX, y: e.clientY, documentId: doc.id })
                    }}
                    className={`flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition ${
                      doc.documentJustCreated ? 'animate-slideIn' : ''
                    } ${
                      doc.documentDeleting ? 'animate-slideOut' : ''
                    }`}
                  >
                    <DocumentIcon className="flex-shrink-0 text-gray-600" />
                    {doc.titleLoading ? (
                      <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse" />
                    ) : (
                      <p className={`text-sm text-gray-800 truncate ${doc.titleJustGenerated ? 'animate-fadeIn' : ''}`}>
                        {doc.title}
                      </p>
                    )}
                  </div>
                ))}
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
                        setFolderToDelete(contextMenu.folderId)
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
                      const directDocs = documents.filter(d => d.folderId === folderToDelete)

                      if (descendantFolders.length > 0) {
                        return `This will delete "${folderName}" and ${descendantFolders.length} subfolder(s) containing ${allDocs.length + directDocs.length} document(s) total.`
                      } else {
                        return `This will delete "${folderName}" and all ${directDocs.length} document(s) inside.`
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
