import { useState, useEffect } from 'react'
import ConversationDisplay from './ConversationDisplay'
import InputArea from './InputArea'
import type { Message } from './types'
import type { Document } from '../../types'
import { sendAgentMessage } from '../../services/api'

interface RightSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  selectedText: string | null
  canvasContent: string
  currentDocumentId: string | null
  currentProjectId: string | null
  documents: Document[]
  onApplyDiff: (diff: { oldText: string; newText: string; explanation: string }) => void
}

function RightSidebar({
  isExpanded,
  onToggle,
  selectedText,
  canvasContent,
  currentDocumentId,
  currentProjectId,
  documents,
  onApplyDiff
}: RightSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [pendingDiff, setPendingDiff] = useState<{ oldText: string; newText: string; explanation: string } | null>(null)

  useEffect(() => {
    // Reset triggers when expansion state changes
    setShowOpenTrigger(false)
    setShowCloseTrigger(false)
  }, [isExpanded])

  const handleSendMessage = async (content: string) => {
    // Add user message
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

    try {
      // Build agent request
      const agentResponse = await sendAgentMessage({
        userMessage: content,
        conversationHistory: messages,
        canvasContent,
        selectedText: selectedText || undefined,
        currentDocumentId: currentDocumentId || undefined,
        currentProjectId: currentProjectId || undefined,
        documents
      })

      // Update agent message with response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: agentResponse.message,
                isLoading: false
              }
            : msg
        )
      )

      // Store diff if provided
      if (agentResponse.diff) {
        setPendingDiff(agentResponse.diff)
      }
    } catch (error) {
      console.error('Error sending agent message:', error)

      // Update with error message
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                content: 'I apologize, but I encountered an error. Please try again.',
                isLoading: false,
                error: 'Failed to get response'
              }
            : msg
        )
      )
    }
  }

  const handleApplyDiff = () => {
    if (pendingDiff) {
      onApplyDiff(pendingDiff)
      setPendingDiff(null)
    }
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

            {/* Pending Diff Display */}
            {pendingDiff && (
              <div className="border-t border-gray-200 p-4 bg-blue-50">
                <p className="text-sm font-semibold text-gray-800 mb-2">Suggested Edit:</p>
                <p className="text-xs text-gray-600 mb-3">{pendingDiff.explanation}</p>
                <button
                  onClick={handleApplyDiff}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                >
                  Apply Edit
                </button>
                <button
                  onClick={() => setPendingDiff(null)}
                  className="w-full px-4 py-1 mt-2 text-sm text-gray-600 hover:text-gray-800 transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Input Area */}
            <InputArea onSendMessage={handleSendMessage} />
          </>
        )}
      </div>
    </>
  )
}

export default RightSidebar
