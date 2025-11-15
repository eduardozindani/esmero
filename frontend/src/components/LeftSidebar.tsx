import { useState, useEffect } from 'react'
import type { Document, Project } from '../types'

interface LeftSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  documents: Document[]
  projects: Project[]
  currentProjectId: string | null
  onDocumentClick: (documentId: string) => void
  onCreateProject: (name: string) => void
  onProjectClick: (projectId: string | null) => void
}

function LeftSidebar({
  isExpanded,
  onToggle,
  documents,
  projects,
  currentProjectId,
  onDocumentClick,
  onCreateProject,
  onProjectClick
}: LeftSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)

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
          bg-gray-50 border-r border-gray-200 p-4 relative
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-0 overflow-hidden p-0 border-0'}
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

            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="mb-4">
                <button
                  onClick={() => onCreateProject('New Project')}
                  className="w-full text-sm bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-700 transition"
                >
                  + New Project
                </button>
              </div>

              {/* Back button when inside a project */}
              {currentProjectId && (
                <div className="mb-4">
                  <button
                    onClick={() => onProjectClick(null)}
                    className="w-full text-sm text-gray-600 px-3 py-2 rounded hover:bg-gray-200 transition text-left"
                  >
                    ← Back to All
                  </button>
                </div>
              )}

              {/* Projects Section */}
              {!currentProjectId && sortedProjects.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">PROJECTS</p>
                  {sortedProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => onProjectClick(project.id)}
                      className="p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition"
                    >
                      <p className="text-sm text-gray-800 font-medium truncate">
                        {project.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Section */}
              <div className="flex-1 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">DOCUMENTS</p>
                {sortedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => onDocumentClick(doc.id)}
                    className="p-2 hover:bg-gray-200 rounded cursor-pointer mb-1 transition"
                  >
                    <p className="text-sm text-gray-800 truncate">
                      {doc.title || 'Untitled'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default LeftSidebar
