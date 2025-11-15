import { useState, useEffect, useRef } from 'react'

interface InputAreaProps {
  onSendMessage: (message: string) => void
}

function InputArea({ onSendMessage }: InputAreaProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea smoothly as content increases
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const minHeight = 65
    const maxHeight = 160

    // If empty, reset to minimum height
    if (input === '') {
      textarea.style.height = `${minHeight}px`
      return
    }

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto'

    // Calculate new height based on content
    const scrollHeight = textarea.scrollHeight

    // Constrain height between min and max
    const constrainedHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight)
    textarea.style.height = `${constrainedHeight}px`
  }, [input])

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim())
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-4 h-[192px] flex-shrink-0">
      <div className="relative h-full flex items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the agent..."
          className="w-full pr-12 p-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl resize-none overflow-y-auto focus:outline-none focus:border-gray-300 transition"
        />
        <button
          onClick={handleSend}
          className={`absolute bottom-3 right-3 text-gray-500 hover:text-gray-700 transition ${
            input.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 10H15M15 10L11 6M15 10L11 14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default InputArea
