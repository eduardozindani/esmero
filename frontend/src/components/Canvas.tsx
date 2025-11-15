interface CanvasProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selected: string | null) => void
  onSave: () => void
}

function Canvas({ content, onChange, onSelectionChange, onSave }: CanvasProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const selected = target.value.substring(target.selectionStart, target.selectionEnd)
    onSelectionChange(selected.length > 0 ? selected : null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter without Shift = save document
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (content.trim().length > 0) {
        onSave()
      }
    }
    // Shift+Enter = normal line break (default behavior)
  }

  return (
    <div className="flex-1 bg-white">
      <textarea
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-8 resize-none focus:outline-none text-gray-800"
        placeholder="Start writing..."
      />
    </div>
  )
}

export default Canvas
