import { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'

interface FloatingToolbarProps {
  editor: Editor
}

function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const { from, to } = editor.state.selection
      const hasSelection = from !== to

      if (hasSelection) {
        e.preventDefault()

        // Get selection coordinates
        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const rect = range.getBoundingClientRect()

          // Position toolbar above selection, centered
          const toolbarWidth = 240 // Approximate width
          const left = rect.left + (rect.width / 2) - (toolbarWidth / 2)
          const top = rect.top - 50 // 50px above selection

          setPosition({
            top: Math.max(10, top), // Don't go above viewport
            left: Math.max(10, Math.min(left, window.innerWidth - toolbarWidth - 10))
          })
          setIsVisible(true)
        }
      }
    }

    const handleClick = (e: MouseEvent) => {
      // Hide toolbar if clicking outside of it
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setIsVisible(false)
      }
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('click', handleClick)

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('click', handleClick)
    }
  }, [editor])

  if (!isVisible) return null

  const isActive = (format: 'bold' | 'italic' | 'heading', level?: 1 | 2 | 3) => {
    if (format === 'heading' && level) {
      return editor.isActive('heading', { level })
    }
    return editor.isActive(format)
  }

  const toggleFormat = (format: 'bold' | 'italic' | 'heading', level?: 1 | 2 | 3) => {
    if (format === 'heading' && level) {
      editor.chain().focus().toggleHeading({ level }).run()
    } else if (format === 'bold') {
      editor.chain().focus().toggleBold().run()
    } else if (format === 'italic') {
      editor.chain().focus().toggleItalic().run()
    }
  }

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg px-2 py-1 flex items-center gap-1"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        onClick={() => toggleFormat('bold')}
        className={`px-3 py-1.5 rounded font-bold transition ${
          isActive('bold')
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title="Bold (Cmd+B)"
      >
        B
      </button>

      <button
        onClick={() => toggleFormat('italic')}
        className={`px-3 py-1.5 rounded italic transition ${
          isActive('italic')
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title="Italic (Cmd+I)"
      >
        I
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1" />

      <button
        onClick={() => toggleFormat('heading', 1)}
        className={`px-3 py-1.5 rounded font-bold text-sm transition ${
          isActive('heading', 1)
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title="Heading 1 (Cmd+1)"
      >
        H1
      </button>

      <button
        onClick={() => toggleFormat('heading', 2)}
        className={`px-3 py-1.5 rounded font-bold text-sm transition ${
          isActive('heading', 2)
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title="Heading 2 (Cmd+2)"
      >
        H2
      </button>

      <button
        onClick={() => toggleFormat('heading', 3)}
        className={`px-3 py-1.5 rounded font-bold text-sm transition ${
          isActive('heading', 3)
            ? 'bg-gray-800 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
        title="Heading 3 (Cmd+3)"
      >
        H3
      </button>
    </div>
  )
}

export default FloatingToolbar
