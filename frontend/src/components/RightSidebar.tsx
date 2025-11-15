import { useState } from 'react'

interface RightSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  selectedText: string | null
}

function RightSidebar({ isExpanded, onToggle, selectedText }: RightSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)

  return (
    <>
      {/* Collapsed state: hover trigger to open */}
      {!isExpanded && (
        <div
          onClick={onToggle}
          className="fixed right-0 top-0 h-full w-10 z-10 cursor-pointer"
          onMouseEnter={() => setShowOpenTrigger(true)}
          onMouseLeave={() => setShowOpenTrigger(false)}
        >
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2
                       bg-gray-800/20 backdrop-blur-sm
                       h-16 w-8 rounded-l-lg
                       flex items-center justify-center
                       text-gray-600
                       transition-opacity duration-200 pointer-events-none
                       ${showOpenTrigger ? 'opacity-100' : 'opacity-0'}`}
          >
            ←
          </div>
        </div>
      )}

      {/* Expanded state: full sidebar */}
      <div
        className={`
          bg-gray-50 border-l border-gray-200 p-4 relative
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-80' : 'w-0 overflow-hidden p-0 border-0'}
        `}
      >
        {isExpanded && (
          <>
            {/* Close trigger strip spanning both sides of division */}
            <div
              onClick={onToggle}
              className="absolute -left-6 top-0 h-full w-12 z-20 cursor-pointer"
              onMouseEnter={() => setShowCloseTrigger(true)}
              onMouseLeave={() => setShowCloseTrigger(false)}
            >
              <div
                className={`absolute -right-2 top-1/2 -translate-y-1/2
                           bg-gray-800/20 backdrop-blur-sm
                           h-16 w-8 rounded-r-lg
                           flex items-center justify-center
                           text-gray-600
                           transition-opacity duration-200 pointer-events-none
                           ${showCloseTrigger ? 'opacity-100' : 'opacity-0'}`}
              >
                →
              </div>
            </div>

            <p className="text-sm text-gray-500 mb-4">Agent</p>
            {selectedText && (
              <div className="text-xs text-gray-400 bg-white p-2 rounded border border-gray-200">
                <p className="font-medium mb-1">Selected:</p>
                <p className="italic">{selectedText}</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

export default RightSidebar
