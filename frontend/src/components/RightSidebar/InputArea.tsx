import { useState } from 'react'

interface InputAreaProps {
  onSendMessage: (message: string) => void
  onClear: () => void
}

function InputArea({ onSendMessage, onClear }: InputAreaProps) {
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
    <div className="border-t border-gray-200 p-4">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask the agent..."
        className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-500"
        rows={3}
      />
      <div className="flex justify-between mt-2">
        <button
          onClick={onClear}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
        >
          Clear
        </button>
        <button
          onClick={handleSend}
          className="px-4 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default InputArea
