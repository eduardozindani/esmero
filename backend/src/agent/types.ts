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
  projects: Array<{
    id: string
    name: string
  }>
}

// Zod schema for agent response (structured LLM output)
export const AgentResponseSchema = z.object({
  reasoning: z.string().describe('Internal thinking process about the request'),
  response: z.string().describe('Text response to the user'),
  diff: z.object({
    chunks: z.array(z.object({
      oldText: z.string().describe('Exact text from canvas to be replaced'),
      newText: z.string().describe('New text to replace with'),
      explanation: z.string().describe('Why this specific change is needed')
    })).describe('Array of text chunks to replace - each chunk is independent'),
    explanation: z.string().describe('Overall explanation of all the changes')
  }).nullish().describe('Suggested edits to canvas content as chunks. Return null if no edits needed. Each chunk shows old → new text with red/green diff.')
})

export type AgentResponse = z.infer<typeof AgentResponseSchema>

// ============================================================================
// Agent Execution Types
// ============================================================================

export interface AgentExecutionResult {
  response: string
  diff: {
    chunks: Array<{
      oldText: string
      newText: string
      explanation: string
    }>
    explanation: string
  } | null
  reasoning: string
  promptContext?: LLMContext  // For debugging
}
