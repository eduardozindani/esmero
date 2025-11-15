/**
 * DiffOverlay - Renders inline diffs over the canvas
 * Shows red (deletions) and green (additions) with accept/reject controls
 */

import { useState, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { findTextInEditor } from '../utils/textMatching'

interface DiffChunk {
  id: string
  oldText: string
  newText: string
  explanation: string
}

interface DiffOverlayProps {
  editor: Editor | null
  chunks: DiffChunk[]
  onAccept: (chunkId: string) => void
  onReject: (chunkId: string) => void
  onRejectAll: () => void
}

interface PositionedChunk extends DiffChunk {
  position: { from: number; to: number } | null
}

function DiffOverlay({ editor, chunks, onAccept, onReject, onRejectAll }: DiffOverlayProps) {
  const [positionedChunks, setPositionedChunks] = useState<PositionedChunk[]>([])

  useEffect(() => {
    if (!editor) return

    // Find positions for each chunk
    const positioned = chunks.map(chunk => ({
      ...chunk,
      position: findTextInEditor(editor, chunk.oldText)
    }))

    setPositionedChunks(positioned)
  }, [editor, chunks])

  if (!editor || positionedChunks.length === 0) {
    return null
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Global controls */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={onRejectAll}
          className="px-3 py-1 bg-gray-800 text-white text-xs rounded shadow-lg hover:bg-gray-900 transition"
        >
          Reject All
        </button>
      </div>

      {/* Render each positioned chunk */}
      {positionedChunks.map(chunk => chunk.position && (
        <DiffChunkDisplay
          key={chunk.id}
          chunk={chunk}
          position={chunk.position}
          editor={editor}
          onAccept={() => onAccept(chunk.id)}
          onReject={() => onReject(chunk.id)}
        />
      ))}
    </div>
  )
}

interface DiffChunkDisplayProps {
  chunk: DiffChunk
  position: { from: number; to: number }
  editor: Editor
  onAccept: () => void
  onReject: () => void
}

function DiffChunkDisplay({ chunk, position, editor, onAccept, onReject }: DiffChunkDisplayProps) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)

  useEffect(() => {
    // Get DOM coordinates for the text position
    const view = editor.view
    const start = view.coordsAtPos(position.from)
    const end = view.coordsAtPos(position.to)

    if (start && end) {
      const editorRect = view.dom.getBoundingClientRect()
      setCoords({
        top: start.top - editorRect.top,
        left: start.left - editorRect.left,
        width: end.right - start.left
      })
    }
  }, [editor, position])

  if (!coords) return null

  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        width: `${coords.width}px`
      }}
    >
      {/* Deletion (red background with strikethrough) */}
      <div className="relative mb-1">
        <div className="bg-red-100 border-l-2 border-red-500 px-2 py-1 rounded text-sm">
          <span className="text-red-800 line-through">{chunk.oldText}</span>
        </div>
      </div>

      {/* Addition (green background) */}
      <div className="relative mb-2">
        <div className="bg-green-100 border-l-2 border-green-500 px-2 py-1 rounded text-sm">
          <span className="text-green-800">{chunk.newText}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={onAccept}
          className="flex-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition shadow-sm"
          title={chunk.explanation}
        >
          ✓ Accept
        </button>
        <button
          onClick={onReject}
          className="flex-1 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition shadow-sm"
        >
          ✗ Reject
        </button>
      </div>

      {/* Explanation tooltip */}
      <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
        {chunk.explanation}
      </div>
    </div>
  )
}

export default DiffOverlay
