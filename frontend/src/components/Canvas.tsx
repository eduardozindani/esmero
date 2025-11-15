import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import FloatingToolbar from './FloatingToolbar'
import DiffOverlay from './DiffOverlay'

interface CanvasProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selected: string | null) => void
  onSave: () => void
  pendingDiffChunks: Array<{
    id: string
    oldText: string
    newText: string
    explanation: string
  }> | null
  onAcceptChunk: (chunkId: string) => void
  onRejectChunk: (chunkId: string) => void
  onRejectAllDiffs: () => void
}

function Canvas({
  content,
  onChange,
  onSelectionChange,
  onSave,
  pendingDiffChunks,
  onAcceptChunk,
  onRejectChunk,
  onRejectAllDiffs
}: CanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
    ],
    content: content,
    autofocus: 'start',
    editorProps: {
      attributes: {
        class: 'w-full focus:outline-none text-gray-800',
        'data-placeholder': 'Start writing...',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to, ' ')
      onSelectionChange(selectedText.length > 0 ? selectedText : null)
    },
  })

  // Update editor content when prop changes (for loading documents)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+1/2/3 for headings
      if ((e.metaKey || e.ctrlKey) && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        const level = parseInt(e.key) as 1 | 2 | 3
        editor.chain().focus().toggleHeading({ level }).run()
        return
      }

      // Enter to save (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        const html = editor.getHTML()
        // Only save if there's content beyond the empty paragraph tags
        if (html.trim() !== '<p></p>' && html.trim().length > 0) {
          e.preventDefault()
          onSave()
        }
      }
    }

    const editorElement = editorRef.current
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown)
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor, onSave])

  // Click anywhere to focus editor
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!editor) return

    const target = e.target as HTMLElement
    const proseMirrorElement = target.closest('.ProseMirror')

    // If click is NOT on ProseMirror content (empty space), focus at end
    if (!proseMirrorElement) {
      editor.commands.focus('end')
    }
  }

  return (
    <div
      ref={editorRef}
      className="flex-1 bg-white relative overflow-y-auto cursor-text min-h-full p-8"
      onClick={handleCanvasClick}
    >
      <EditorContent editor={editor} />
      {editor && <FloatingToolbar editor={editor} />}
      {editor && pendingDiffChunks && pendingDiffChunks.length > 0 && (
        <DiffOverlay
          editor={editor}
          chunks={pendingDiffChunks}
          onAccept={onAcceptChunk}
          onReject={onRejectChunk}
          onRejectAll={onRejectAllDiffs}
        />
      )}
    </div>
  )
}

export default Canvas
