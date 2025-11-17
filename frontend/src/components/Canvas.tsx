import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import FloatingToolbar from './FloatingToolbar'
import { DiffExtension } from '../extensions/DiffExtension'

interface CanvasProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selected: string | null) => void
  onSave: () => void
  onDelete: () => void
  pendingDiffChunks: Array<{
    id: string
    oldText: string
    newText: string
    explanation: string
  }> | null
  onAcceptChunk: (chunkId: string) => void
  onRejectChunk: (chunkId: string) => void
  onRejectAllDiffs: () => void
  focusTrigger: number
}

function Canvas({
  content,
  onChange,
  onSelectionChange,
  onSave,
  onDelete,
  pendingDiffChunks,
  onAcceptChunk,
  onRejectChunk,
  onRejectAllDiffs,
  focusTrigger
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
      DiffExtension.configure({
        onAcceptChunk: onAcceptChunk,
        onRejectChunk: onRejectChunk,
      }),
    ],
    content: content,
    autofocus: 'start',
    editorProps: {
      attributes: {
        class: 'w-full focus:outline-none text-gray-800',
        'data-placeholder': 'Start writing...',
      },
      handleKeyDown: (view, event) => {
        // Intercept Enter key at TipTap level (before internal handlers)
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault()
          const textContent = view.state.doc.textContent

          // If content is empty/whitespace-only, delete the document
          if (textContent.trim().length === 0) {
            onDelete()
          } else {
            // Otherwise save
            onSave()
          }
          return true // Handled, don't propagate
        }
        return false // Not handled, let TipTap process other keys
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

  // Update diff chunks when they change
  useEffect(() => {
    if (!editor) return

    if (pendingDiffChunks && pendingDiffChunks.length > 0) {
      editor.commands.setDiffChunks(pendingDiffChunks)
    } else {
      editor.commands.setDiffChunks([])
    }
  }, [editor, pendingDiffChunks])

  // Focus editor when trigger changes
  useEffect(() => {
    if (!editor || focusTrigger === 0) return

    // Get the document and find the last position with actual content
    const doc = editor.state.doc
    const lastPos = doc.content.size - 1

    // Focus and set cursor to the very end
    editor.commands.focus()
    editor.commands.setTextSelection(lastPos)
  }, [editor, focusTrigger])

  // Global click handler for diff buttons (bypasses TipTap event system)
  useEffect(() => {
    const editorElement = editorRef.current
    if (!editorElement || !editor) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Check if click is on accept button
      const acceptBtn = target.closest('.diff-accept-btn') as HTMLElement
      if (acceptBtn) {
        const chunkId = acceptBtn.dataset.chunkId
        if (chunkId) {
          e.preventDefault()
          e.stopPropagation()
          console.log('Accept button clicked:', chunkId)

          // Find the chunk
          const chunk = pendingDiffChunks?.find(c => c.id === chunkId)
          if (chunk) {
            // Apply the change using TipTap editor
            const docText = editor.state.doc.textContent

            if (chunk.oldText === '' || chunk.oldText.trim() === '') {
              // Adding new content - insert at end
              editor.chain().focus('end').insertContent(chunk.newText).run()
            } else {
              // Replacing existing text - find and replace
              const index = docText.indexOf(chunk.oldText)
              if (index !== -1) {
                const from = index + 1 // ProseMirror is 1-indexed
                const to = from + chunk.oldText.length

                // Delete old text and insert new text
                editor.chain()
                  .focus()
                  .deleteRange({ from, to })
                  .insertContentAt(from, chunk.newText)
                  .run()
              }
            }
          }

          // Notify parent to remove chunk from state
          onAcceptChunk(chunkId)
          return
        }
      }

      // Check if click is on reject button
      const rejectBtn = target.closest('.diff-reject-btn') as HTMLElement
      if (rejectBtn) {
        const chunkId = rejectBtn.dataset.chunkId
        if (chunkId) {
          e.preventDefault()
          e.stopPropagation()
          console.log('Reject button clicked:', chunkId)
          onRejectChunk(chunkId)
          return
        }
      }
    }

    // Attach to editor container with capture phase
    editorElement.addEventListener('click', handleClick, true)

    return () => {
      editorElement.removeEventListener('click', handleClick, true)
    }
  }, [editor, onAcceptChunk, onRejectChunk, pendingDiffChunks])

  // Keyboard shortcuts for headings
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
    }

    const editorElement = editorRef.current
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown)
      return () => {
        editorElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editor])

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
      {pendingDiffChunks && pendingDiffChunks.length > 0 && (
        <div className="fixed top-4 right-96 z-20">
          <button
            onClick={onRejectAllDiffs}
            className="px-3 py-1 bg-gray-800 text-white text-sm rounded shadow-lg hover:bg-gray-900 transition"
          >
            Reject All Changes
          </button>
        </div>
      )}
    </div>
  )
}

export default Canvas
