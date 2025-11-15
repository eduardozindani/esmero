import { z } from 'zod'

// ============================================================================
// LLM Infrastructure Types (from AI Chef pattern)
// ============================================================================

export interface LLMContext {
  systemPrompt: string
  userPrompt: string
}

export interface BaseLLMConfig {
  model?: string
  temperature?: number
  topP?: number
  maxTokens?: number
  retryTimeout?: number
}

export interface StringCompletionConfig extends BaseLLMConfig {
  schema: z.ZodString
}

export interface StructuredCompletionConfig<T extends z.ZodType> extends BaseLLMConfig {
  schema: T
  schemaName: string
  schemaDescription: string
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: number
  intelligence?: string  // Optional reasoning (for future intelligence embedding)
}

// ============================================================================
// Context Types
// ============================================================================

export interface ConversationContext {
  messages: Message[]
  structured: string  // Formatted for LLM prompt
}

export interface FileContext {
  currentSelection: string | null
  currentPage: {
    id: string
    title: string
    content: string
  } | null
  projectDocuments: Array<{
    id: string
    title: string
    content: string
  }>
  structured: string  // Formatted for LLM prompt
}

export interface Context {
  conversation: ConversationContext
  file: FileContext
}

// ============================================================================
// Agent Request/Response Types
// ============================================================================

export interface IncomingAgentRequest {
  userMessage: string
  conversationHistory: Message[]
  canvasContent: string
  selectedText?: string
  currentDocumentId?: string
  currentProjectId?: string
  documents: Array<{
    id: string
    title: string
    content: string
    projectId: string | null
  }>
}

// Zod schema for agent response (structured LLM output)
export const AgentResponseSchema = z.object({
  reasoning: z.string().describe('Internal thinking process about the request'),
  response: z.string().describe('Text response to the user'),
  diff: z.object({
    oldText: z.string().describe('Text to be replaced in the canvas'),
    newText: z.string().describe('New text to replace with'),
    explanation: z.string().describe('Explanation of why this change is suggested')
  }).nullish().describe('Suggested edit to canvas content, null or omit if no edit needed')
})

export type AgentResponse = z.infer<typeof AgentResponseSchema>

// ============================================================================
// Agent Execution Types
// ============================================================================

export interface AgentExecutionResult {
  response: string
  diff: {
    oldText: string
    newText: string
    explanation: string
  } | null
  reasoning: string
  promptContext?: LLMContext  // For debugging
}
