import { useState, useEffect } from 'react'
import ConversationDisplay from './ConversationDisplay'
import InputArea from './InputArea'
import ResizeHandle from '../ResizeHandle'
import type { Message } from './types'
import type { Document, Folder } from '../../types'
import { streamAgentMessage } from '../../services/api'

interface RightSidebarProps {
  isExpanded: boolean
  onToggle: () => void
  width: number
  onResize: (width: number) => void
  selectedText: string | null
  canvasContent: string
  currentDocumentId: string | null
  currentFolderId: string | null
  documents: Document[]
  folders: Folder[]
  onDiffReceived: (chunks: Array<{ id: string; oldText: string; newText: string; explanation: string }> | null) => void
}

function RightSidebar({
  isExpanded,
  onToggle,
  width,
  onResize,
  selectedText,
  canvasContent,
  currentDocumentId,
  currentFolderId,
  documents,
  folders,
  onDiffReceived
}: RightSidebarProps) {
  const [showOpenTrigger, setShowOpenTrigger] = useState(false)
  const [showCloseTrigger, setShowCloseTrigger] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isResizing, setIsResizing] = useState(false)

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

    // Accumulate chunks as they stream in
    const accumulatedChunks: Array<{ id: string; oldText: string; newText: string; explanation: string }> = []

    try {
      // Stream agent response
      // NOTE: Backend will add current message to history, so we only send previous messages
      await streamAgentMessage(
        {
          userMessage: content,
          conversationHistory: messages,  // Previous messages only (current message excluded)
          canvasContent,
          selectedText: selectedText || undefined,
          currentDocumentId: currentDocumentId || undefined,
          currentFolderId: currentFolderId || undefined,
          documents,
          folders
        },
        {
          // Called for each diff chunk as it arrives
          onChunk: (chunk) => {
            console.log('Received chunk:', chunk)
            accumulatedChunks.push(chunk)

            // Immediately send to parent for progressive rendering
            onDiffReceived([...accumulatedChunks])
          },

          // Called when final message text arrives
          onMessage: (message) => {
            console.log('Received final message:', message)

            // Update agent message with response
            setMessages(prev =>
              prev.map(msg =>
                msg.id === loadingMessageId
                  ? {
                      ...msg,
                      content: message,
                      isLoading: false
                    }
                  : msg
              )
            )
          },

          // Called when stream completes
          onComplete: () => {
            console.log('Stream completed')
          },

          // Called on error
          onError: (error) => {
            console.error('Streaming error:', error)

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
      )
    } catch (error) {
      console.error('Error streaming agent message:', error)

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

  return (
    <>
      {/* Collapsed state: hover trigger to open */}
      {!isExpanded && (
        <div
          onClick={onToggle}
          className="fixed right-0 top-0 h-full w-20 z-10 cursor-pointer"
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
          ${isResizing ? '' : 'transition-all duration-300 ease-in-out'}
          ${isExpanded ? '' : 'w-0 overflow-hidden border-0'}
        `}
        style={{ width: isExpanded ? `${width}px` : 0 }}
      >
        {isExpanded && (
          <>
            {/* Resize handle */}
            <ResizeHandle
              side="right"
              onResize={onResize}
              currentWidth={width}
              onResizeStart={() => setIsResizing(true)}
              onResizeEnd={() => setIsResizing(false)}
            />

            {/* Close trigger strip spanning both sides of division */}
            {!isResizing && (
              <div
                onClick={onToggle}
                className="absolute -left-10 top-0 h-full w-20 z-20 cursor-pointer"
                onMouseEnter={() => setShowCloseTrigger(true)}
                onMouseLeave={() => setShowCloseTrigger(false)}
              >
                <div
                  className={`absolute left-10 top-1/2 -translate-y-1/2
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
            )}

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
