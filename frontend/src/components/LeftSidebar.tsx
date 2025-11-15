import { useState, useEffect } from 'react'
import type { Document, Project } from '../types'
import FolderClosed from './icons/FolderClosed'
import FolderOpen from './icons/FolderOpen'
import DocumentIcon from './icons/DocumentIcon'

interface LeftSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  documents: Document[]
  projects: Project[]
  currentProjectId: string | null
  onDocumentClick: (documentId: string) => void
  onCreateProject: (name: string) => void
  onProjectClick: (projectId: string | null) => void
  onUpdateProjectName: (projectId: string, newName: string) => void
  onDeleteDocument: (documentId: string) => void
  onDeleteProject: (projectId: string) => void
}

function LeftSidebar({
  isExpanded,
  onToggle,
  documents,
  projects,
  currentProjectId,
  onDocumentClick,
  onCreateProject,
  onProjectClick,
  onUpdateProjectName,
  onDeleteDocument,
  onDeleteProject
}: LeftSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; projectId?: string; documentId?: string } | null>(null)

  const handleDeleteProject = (projectId: string) => {
    onDeleteProject(projectId)
    setProjectToDelete(null)
    setContextMenu(null)
    // If we're currently in this project, go back to all
    if (currentProjectId === projectId) {
      onProjectClick(null)
    }
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

  // Filter and sort documents
  const filteredDocuments = currentProjectId
    ? documents.filter(doc => doc.projectId === currentProjectId)
    : documents.filter(doc => doc.projectId === null)

  const sortedDocuments = [...filteredDocuments].sort((a, b) => b.updatedAt - a.updatedAt)
  const sortedProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <>
      {/* Collapsed state: hover trigger to open */}
      {!isExpanded && (
        <div
          onClick={onToggle}
          className="fixed left-0 top-0 h-full w-10 z-10 cursor-pointer"
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
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-0 overflow-hidden border-0'}
        `}
      >
        {isExpanded && (
          <>
            {/* Close trigger strip spanning both sides of division */}
            <div
              onClick={onToggle}
              className="absolute -right-6 top-0 h-full w-12 z-20 cursor-pointer"
              onMouseEnter={() => setShowCloseTrigger(true)}
              onMouseLeave={() => setShowCloseTrigger(false)}
            >
              <div
                className={`absolute -left-2 top-1/2 -translate-y-1/2
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

            <div className="flex flex-col h-full p-4">
              {/* New Project - only show when NOT in a project */}
              {!currentProjectId && (
                <div className="mb-4">
                  <div
                    onClick={() => onCreateProject('New Project')}
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer transition"
                  >
                    <span className="flex-shrink-0 text-gray-600 text-sm">+</span>
                    <p className="text-sm text-gray-600 font-bold">New Project</p>
                  </div>
                </div>
              )}

              {/* Project name header when inside a project */}
              {currentProjectId && (
                <div className="mb-4">
                  {editingProjectName ? (
                    <div className="flex items-center gap-2 w-full min-w-0">
                      <FolderOpen className="flex-shrink-0 text-gray-600" />
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateProjectName(currentProjectId, editedName)
                            setEditingProjectName(false)
                          } else if (e.key === 'Escape') {
                            setEditingProjectName(false)
                          }
                        }}
                        onBlur={() => setEditingProjectName(false)}
                        autoFocus
                        className="flex-1 min-w-0 text-lg font-bold px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-gray-500"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        onClick={() => onProjectClick(null)}
                        className="flex-shrink-0 text-gray-600 cursor-pointer hover:text-gray-800 transition px-2 py-1"
                      >
                        ←
                      </span>
                      <div
                        onClick={() => {
                          const project = projects.find(p => p.id === currentProjectId)
                          if (project) {
                            setEditedName(project.name)
                            setEditingProjectName(true)
                          }
                        }}
                        className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition flex-1 min-w-0"
                      >
                        <FolderOpen className="flex-shrink-0 text-gray-600" />
                        <h2 className="text-lg font-bold truncate">
                          {projects.find(p => p.id === currentProjectId)?.name || 'Untitled'}
                        </h2>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Projects Section */}
              {!currentProjectId && sortedProjects.length > 0 && (
                <div className="mb-4">
                  {sortedProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => onProjectClick(project.id)}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setContextMenu({ x: e.clientX, y: e.clientY, projectId: project.id })
                      }}
                      className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition"
                    >
                      <FolderClosed className="flex-shrink-0 text-gray-600" />
                      <p className="text-sm text-gray-800 font-bold truncate">
                        {project.name}
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
                    className="flex items-center gap-2 p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition"
                  >
                    <DocumentIcon className="flex-shrink-0 text-gray-600" />
                    {doc.titleLoading ? (
                      <div className="flex-1 h-4 bg-gray-300 rounded animate-pulse" />
                    ) : (
                      <p className="text-sm text-gray-800 truncate animate-fadeIn">
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
                      if (contextMenu.projectId) {
                        setProjectToDelete(contextMenu.projectId)
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

            {/* Delete Project Confirmation Modal */}
            {projectToDelete && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setProjectToDelete(null)}>
                <div className="bg-white rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
                  <h3 className="text-lg font-bold mb-2">Delete Project?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    This will delete "{projects.find(p => p.id === projectToDelete)?.name}" and all {documents.filter(d => d.projectId === projectToDelete).length} document(s) inside.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setProjectToDelete(null)}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteProject(projectToDelete)}
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
