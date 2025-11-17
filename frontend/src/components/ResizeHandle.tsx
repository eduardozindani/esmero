import { useState, useEffect, useCallback } from 'react'
import { RESIZE_HANDLE, SIDEBAR_CONSTRAINTS, ANIMATIONS } from '../constants/ui'

interface ResizeHandleProps {
  side: 'left' | 'right'
  onResize: (newWidth: number) => void
  currentWidth: number
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

/**
 * ResizeHandle Component
 *
 * Provides a draggable handle for resizing sidebars with three visual states:
 * 1. Default (invisible) - Clean appearance when not interacting
 * 2. Hover (visible) - Light gray line showing the handle is grabbable
 * 3. Dragging (prominent) - Thicker, darker line during active resize
 *
 * The handle is positioned on the edge of its parent sidebar and extends
 * slightly beyond it for easier mouse targeting.
 */
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

    // Lock visual state to prevent flicker during resize
    setIsResizing(true)
    setShowHandle(true)

    // Store initial position and width for calculating deltas
    setStartX(e.clientX)
    setStartWidth(currentWidth)

    onResizeStart?.()
  }, [currentWidth, onResizeStart])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX

      // Calculate new width based on sidebar side
      // Left sidebar: drag right increases width
      // Right sidebar: drag left increases width
      const newWidth = side === 'left'
        ? startWidth + deltaX
        : startWidth - deltaX

      // Apply constraints to prevent sidebars from becoming too small or too large
      const maxWidth = window.innerWidth * SIDEBAR_CONSTRAINTS.MAX_WIDTH_PERCENT
      const constrainedWidth = Math.min(
        Math.max(newWidth, SIDEBAR_CONSTRAINTS.MIN_WIDTH),
        maxWidth
      )

      onResize(constrainedWidth)
    }

    const handleMouseUp = () => {
      // Reset states after resize completes
      setIsResizing(false)
      setShowHandle(false)
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

  const positionClass = side === 'left'
    ? `-right-${RESIZE_HANDLE.POSITION_OFFSET}`
    : `-left-${RESIZE_HANDLE.POSITION_OFFSET}`

  return (
    <div
      className={`absolute top-0 h-full z-30 ${positionClass}`}
      style={{ width: `${RESIZE_HANDLE.HOVER_ZONE_WIDTH}px` }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isResizing && setShowHandle(true)}
      onMouseLeave={() => !isResizing && setShowHandle(false)}
    >
      {/* Interactive resize zone with visual feedback */}
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ cursor: 'ew-resize' }}
      >
        {/* Visual indicator: vertical line that adapts to interaction state */}
        <div
          className={`h-full transition-all duration-${ANIMATIONS.RESIZE_FEEDBACK} ${
            side === 'left' ? 'mr-1' : 'ml-1'
          }`}
          style={{
            width: isResizing
              ? `${RESIZE_HANDLE.LINE_WIDTH_DRAGGING}px`
              : showHandle
                ? `${RESIZE_HANDLE.LINE_WIDTH_HOVER}px`
                : `${RESIZE_HANDLE.LINE_WIDTH_DEFAULT}px`,
            backgroundColor: isResizing
              ? RESIZE_HANDLE.COLOR_DRAGGING
              : showHandle
                ? RESIZE_HANDLE.COLOR_HOVER
                : 'transparent'
          }}
        />
      </div>
    </div>
  )
}

export default ResizeHandle