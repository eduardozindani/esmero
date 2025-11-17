import { useState, useEffect, useCallback } from 'react'

interface ResizeHandleProps {
  side: 'left' | 'right'
  onResize: (newWidth: number) => void
  currentWidth: number
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

function ResizeHandle({
  side,
  onResize,
  currentWidth,
  onResizeStart,
  onResizeEnd
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false)
  const [showHandle, setShowHandle] = useState(false)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setShowHandle(true) // Lock visual state to visible immediately
    setStartX(e.clientX)
    setStartWidth(currentWidth)
    onResizeStart?.()
  }, [currentWidth, onResizeStart])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const newWidth = side === 'left'
        ? startWidth + deltaX
        : startWidth - deltaX

      // Constraints
      const minWidth = 150
      const maxWidth = window.innerWidth * 0.5
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)

      onResize(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setShowHandle(false) // Reset visual state after resize completes
      onResizeEnd?.()
    }

    // Prevent text selection during drag
    const prevUserSelect = document.body.style.userSelect
    document.body.style.userSelect = 'none'

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = prevUserSelect
    }
  }, [isResizing, startX, startWidth, side, onResize, onResizeEnd])

  return (
    <div
      className={`absolute top-0 h-full z-30 ${
        side === 'left' ? '-right-2' : '-left-2'
      }`}
      style={{ width: '8px' }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isResizing && setShowHandle(true)}
      onMouseLeave={() => !isResizing && setShowHandle(false)}
    >
      {/* Three visual states */}
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ cursor: 'ew-resize' }}
      >
        {/* Vertical line that changes based on state */}
        <div
          className={`h-full transition-all duration-200 ${
            side === 'left' ? 'mr-1' : 'ml-1'
          }`}
          style={{
            width: isResizing ? '3px' : showHandle ? '2px' : '1px',
            backgroundColor: isResizing
              ? 'rgba(107, 114, 128, 0.5)' // gray-500 with opacity when dragging
              : showHandle
                ? 'rgba(156, 163, 175, 0.3)' // gray-400 with opacity when hovering
                : 'transparent'
          }}
        />
      </div>
    </div>
  )
}

export default ResizeHandle