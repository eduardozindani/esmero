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
    console.log('Agent request received:', {
      userMessage: request.userMessage.slice(0, 100),
      hasSelection: !!request.selectedText,
      currentDocId: request.currentDocumentId,
      documentsCount: request.documents.length
    })

    // Step 1: Determine context (parallel execution)
    console.log('Determining context...')
    const context = await determineContext(request)

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
