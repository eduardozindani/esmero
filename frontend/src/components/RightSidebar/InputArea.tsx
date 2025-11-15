import { useState, useEffect, useRef } from 'react'

interface InputAreaProps {
  onSendMessage: (message: string) => void
}

function InputArea({ onSendMessage }: InputAreaProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
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
    <div className="p-4 relative">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask the agent..."
        className="w-full pr-12 p-3 text-sm text-gray-900 placeholder-gray-400 bg-white border border-gray-200 rounded resize-none overflow-hidden focus:outline-none focus:border-gray-300 transition min-h-[80px] max-h-[200px]"
      />
      {input.trim() && (
        <button
          onClick={handleSend}
          className="absolute bottom-6 right-6 w-8 h-8 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3l5 5-1.5 1.5L9 7v6H7V7L4.5 9.5 3 8l5-5z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default InputArea
