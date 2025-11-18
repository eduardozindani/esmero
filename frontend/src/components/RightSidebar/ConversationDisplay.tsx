import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { Message } from './types'

interface ConversationDisplayProps {
  messages: Message[]
}

function ConversationDisplay({ messages }: ConversationDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

export default ConversationDisplay