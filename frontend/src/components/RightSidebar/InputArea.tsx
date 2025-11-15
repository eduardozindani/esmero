import { useState } from 'react'

interface InputAreaProps {
  onSendMessage: (message: string) => void
}

function InputArea({ onSendMessage }: InputAreaProps) {
  const [input, setInput] = useState('')

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
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask the agent..."
        rows={2}
        className="w-full pr-12 p-3 text-sm text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-xl resize-none overflow-y-auto focus:outline-none focus:border-gray-300 transition"
      />
      {input.trim() && (
        <button
          onClick={handleSend}
          className="absolute bottom-6 right-6 text-gray-500 hover:text-gray-700 transition"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 15V5M10 5L6 9M10 5L14 9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default InputArea
