import type { Context, IncomingAgentRequest } from '../types.js'
import { determineConversation } from './conversation/conversation.js'
import { determineFile } from './file/file.js'

/**
 * Main context orchestrator
 * Determines context from incoming request in parallel
 * Following AI Chef pattern: parallel execution for performance
 */
export async function determineContext(
  request: IncomingAgentRequest
): Promise<Context> {
  try {
    // Execute context determination in parallel (AI Chef pattern)
    const [conversation, file] = await Promise.all([
      // Conversation context: recent messages + history
      determineConversation(request.conversationHistory),

      // File context: selection + current page + relevant documents (with LLM filtering)
      determineFile({
        userMessage: request.userMessage,
        selectedText: request.selectedText,
        canvasContent: request.canvasContent,
        currentDocumentId: request.currentDocumentId,
        currentFolderId: request.currentFolderId,
        documents: request.documents,
        folders: request.folders
      })
    ])

    return {
      conversation,
      file
    }
  } catch (error) {
    console.error('Error determining context:', error)

    // Graceful fallback (AI Chef pattern)
    throw new Error('Failed to determine context')
  }
}
