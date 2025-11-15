import { useState, useEffect } from 'react'
import ConversationDisplay from './ConversationDisplay'
import InputArea from './InputArea'
import type { Message } from './types'

interface RightSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  selectedText: string | null
}

function RightSidebar({ isExpanded, onToggle, selectedText }: RightSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    // Reset triggers when expansion state changes
    setShowOpenTrigger(false)
    setShowCloseTrigger(false)
  }, [isExpanded])

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, userMessage])

    // Add loading placeholder for agent response
    const loadingMessageId = `agent-${Date.now()}`
    const loadingMessage: Message = {
      id: loadingMessageId,
      role: 'agent',
      content: '',
      timestamp: Date.now(),
      isLoading: true
    }
    setMessages(prev => [...prev, loadingMessage])

    // TODO: Send to backend and get agent response
    // For now, mock response
    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessageId
            ? { ...msg, content: 'This is a mock response. Backend integration pending.', isLoading: false }
            : msg
        )
      )
    }, 500)
  }

  return (
    <>
      {/* Collapsed state: hover trigger to open */}
      {!isExpanded && (
        <div
          onClick={onToggle}
          className="fixed right-0 top-0 h-full w-10 z-10 cursor-pointer"
          onMouseEnter={() => setShowOpenTrigger(true)}
          onMouseLeave={() => setShowOpenTrigger(false)}
        >
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2
                       bg-gray-800/20 backdrop-blur-sm
                       h-16 w-8 rounded-l-lg
                       flex items-center justify-center
                       text-gray-600
                       transition-opacity duration-300 pointer-events-none
                       ${showOpenTrigger ? 'opacity-100' : 'opacity-0'}`}
          >
            ←
          </div>
        </div>
      )}

      {/* Expanded state: full sidebar */}
      <div
        className={`
          bg-gray-50 border-l border-gray-200 relative flex flex-col
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-80' : 'w-0 overflow-hidden border-0'}
        `}
      >
        {isExpanded && (
          <>
            {/* Close trigger strip spanning both sides of division */}
            <div
              onClick={onToggle}
              className="absolute -left-6 top-0 h-full w-12 z-20 cursor-pointer"
              onMouseEnter={() => setShowCloseTrigger(true)}
              onMouseLeave={() => setShowCloseTrigger(false)}
            >
              <div
                className={`absolute -right-2 top-1/2 -translate-y-1/2
                           bg-gray-800/20 backdrop-blur-sm
                           h-16 w-8 rounded-r-lg
                           flex items-center justify-center
                           text-gray-600
                           transition-opacity duration-300 pointer-events-none
                           ${showCloseTrigger ? 'opacity-100' : 'opacity-0'}`}
              >
                →
              </div>
            </div>

            {/* Conversation */}
            <ConversationDisplay messages={messages} />

            {/* Input Area */}
            <InputArea onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    </>
  )
}

export default RightSidebar
