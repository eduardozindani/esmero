import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import FloatingToolbar from './FloatingToolbar'

interface CanvasProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selected: string | null) => void
  onSave: () => void
}

function Canvas({ content, onChange, onSelectionChange, onSave }: CanvasProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable default heading to use custom config
        bold: false, // Disable to use custom extension
        italic: false, // Disable to use custom extension
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
      Bold,
      Italic,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'w-full h-full p-8 focus:outline-none text-gray-800',
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

  // Auto-focus editor only on initial mount
  useEffect(() => {
    if (editor) {
      // Focus editor at the end on mount
      editor.commands.focus('end')
    }
    // Only run on mount when editor is created
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

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

  // Click anywhere in canvas to focus editor
  const handleCanvasClick = () => {
    if (editor && !editor.isFocused) {
      // Just focus without moving cursor - let native click behavior work
      editor.commands.focus()
    }
  }

  return (
    <div
      ref={editorRef}
      className="flex-1 bg-white relative cursor-text"
      onClick={handleCanvasClick}
    >
      <EditorContent editor={editor} />
      {editor && <FloatingToolbar editor={editor} />}
    </div>
  )
}

export default Canvas
