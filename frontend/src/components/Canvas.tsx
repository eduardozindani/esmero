interface CanvasProps {
  content: string
  onChange: (content: string) => void
  onSelectionChange: (selected: string | null) => void
}

function Canvas({ content, onChange, onSelectionChange }: CanvasProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    const selected = target.value.substring(target.selectionStart, target.selectionEnd)
    onSelectionChange(selected.length > 0 ? selected : null)
  }

  return (
    <div className="flex-1 bg-white">
      <textarea
        value={content}
        onChange={handleChange}
        onSelect={handleSelect}
        className="w-full h-full p-8 resize-none focus:outline-none text-gray-800"
        placeholder="Start writing..."
      />
    </div>
  )
}

export default Canvas
