import type { IncomingAgentRequest, AgentExecutionResult } from './types.js'
import { determineContext } from './context/context.js'
import { executeAgent } from './execution/agent.js'

/**
 * Main agent handler - Entry point for agent requests
 * Following AI Chef flow: Request → Context → Execution → Response
 */
export async function handleAgentRequest(
  request: IncomingAgentRequest
): Promise<AgentExecutionResult> {
  try {
    console.log('\n🚀 Agent request received:', {
      userMessage: request.userMessage.slice(0, 100),
      hasSelection: !!request.selectedText,
      hasCanvasContent: !!request.canvasContent,
      canvasLength: request.canvasContent?.length || 0,
      currentDocId: request.currentDocumentId,
      currentFolderId: request.currentFolderId,
      documentsCount: request.documents.length,
      foldersCount: request.folders?.length || 0,
      documentTitles: request.documents.map(d => d.title).slice(0, 5).join(', ')
    })

    // IMPORTANT: Add current user message to conversation history
    // The frontend sends previous messages in conversationHistory,
    // but the CURRENT message needs to be included for context
    const fullConversationHistory = [
      ...request.conversationHistory,
      {
        id: `user-${Date.now()}`,
        role: 'user' as const,
        content: request.userMessage,
        timestamp: Date.now()
      }
    ]

    // Step 1: Determine context (parallel execution)
    console.log('Determining context...')
    console.log('  Conversation history length:', fullConversationHistory.length)
    console.log('  Messages:', fullConversationHistory.map(m => `${m.role}: ${m.content.slice(0, 30)}`))
    const context = await determineContext({
      ...request,
      conversationHistory: fullConversationHistory
    })

    // Step 2: Execute agent
    console.log('Executing agent...')
    const result = await executeAgent(context)

    console.log('Agent execution complete:', {
      responseLength: result.response.length,
      hasDiff: !!result.diff
    })

    return result
  } catch (error) {
    console.error('Handler error:', error)

    // Graceful error response
    return {
      response: 'I encountered an unexpected error. Please try again.',
      diff: null,
      reasoning: 'Handler error occurred'
    }
  }
}
