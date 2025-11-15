import { useState, useEffect } from 'react'

interface LeftSidebarProps {
  isExpanded: boolean
  onToggle: () => void
}

function LeftSidebar({ isExpanded, onToggle }: LeftSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)

  useEffect(() => {
    // Reset triggers when expansion state changes
    setShowOpenTrigger(false)
    setShowCloseTrigger(false)
  }, [isExpanded])

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
                       transition-opacity duration-200 pointer-events-none
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
                           transition-opacity duration-200 pointer-events-none
                           ${showCloseTrigger ? 'opacity-100' : 'opacity-0'}`}
              >
                ←
              </div>
            </div>

            <p className="text-sm text-gray-500">Documents</p>
          </>
        )}
      </div>
    </>
  )
}

export default LeftSidebar
