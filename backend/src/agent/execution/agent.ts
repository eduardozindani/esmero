import type { Context, AgentExecutionResult } from '../types.js'
import { AgentResponseSchema } from '../types.js'
import { buildPrompts } from './prompt.js'
import { callCompletion } from '../../utils/llm.js'

/**
 * Execute agent with determined context
 * Following AI Chef pattern: structured LLM call
 */
export async function executeAgent(context: Context): Promise<AgentExecutionResult> {
  try {
    // Step 1: Build prompts from context
    const promptContext = buildPrompts(context)

    // Debug: Log what we're sending to the LLM
    console.log('\n=== PROMPT BEING SENT TO LLM ===')
    console.log('System Prompt:', promptContext.systemPrompt.slice(0, 200) + '...')
    console.log('\nUser Prompt:')
    console.log(promptContext.userPrompt)
    console.log('=== END PROMPT ===\n')

    // Step 2: Call LLM with structured schema
    // Note: AI Chef runs intelligence extraction in parallel here
    // We skip for MVP (can add later)
    const agentResponse = await callCompletion(promptContext, {
      schema: AgentResponseSchema,
      schemaName: 'agent_response',
      schemaDescription: 'Structured response from the writing assistant',
      model: 'gpt-4.1',  // Use GPT-4.1 for high-quality agent responses
      temperature: 0.7,  // Higher temp for creative writing assistance
      maxTokens: 2000
    })

    // Step 3: Format result
    const result = {
      response: agentResponse.response,
      diff: agentResponse.diff || null,  // Convert undefined to null for consistency
      reasoning: agentResponse.reasoning,
      promptContext  // Include for debugging
    }

    // Debug: Log agent response
    console.log('\n🤖 Agent Response:')
    console.log('  Has diff:', !!result.diff)
    if (result.diff) {
      console.log('  Chunks:', result.diff.chunks.length)
      result.diff.chunks.forEach((chunk, i) => {
        console.log(`    Chunk ${i + 1}:`)
        console.log(`      oldText: "${chunk.oldText.slice(0, 50)}${chunk.oldText.length > 50 ? '...' : ''}"`)
        console.log(`      newText: "${chunk.newText.slice(0, 50)}${chunk.newText.length > 50 ? '...' : ''}"`)
      })
    }
    console.log('  Response:', result.response.slice(0, 100))
    console.log('  Reasoning:', result.reasoning.slice(0, 100))
    console.log('')

    return result
  } catch (error) {
    console.error('Error executing agent:', error)

    // Graceful fallback
    return {
      response: 'I apologize, but I encountered an error processing your request. Please try again.',
      diff: null,
      reasoning: 'Error occurred during agent execution'
    }
  }
}
