import OpenAI from 'openai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type {
  LLMContext,
  StringCompletionConfig,
  StructuredCompletionConfig
} from '../agent/types.js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Default LLM configuration
const DEFAULT_CONFIG = {
  model: 'gpt-4.1-mini',
  temperature: 0.3,
  topP: 1.0,
  maxTokens: 2000,
  retryTimeout: 5000
}

// ============================================================================
// Unified Completion Function (AI Chef Pattern)
// ============================================================================

// Overload 1: String response (natural language)
export function callCompletion(
  context: LLMContext,
  config: StringCompletionConfig
): Promise<string>

// Overload 2: Structured response (JSON with Zod schema)
export function callCompletion<T extends z.ZodType>(
  context: LLMContext,
  config: StructuredCompletionConfig<T>
): Promise<z.infer<T>>

// Implementation
export async function callCompletion<T extends z.ZodType>(
  context: LLMContext,
  config: StringCompletionConfig | StructuredCompletionConfig<T>
): Promise<string | z.infer<T>> {
  const { systemPrompt, userPrompt } = context

  // Merge with defaults
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config
  }

  try {
    // Determine if this is a string schema or structured schema
    const isStringSchema = config.schema instanceof z.ZodString

    if (isStringSchema) {
      // Natural language response (no JSON mode)
      const completion = await openai.chat.completions.create({
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        top_p: finalConfig.topP,
        max_tokens: finalConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })

      const response = completion.choices[0]?.message?.content || ''
      return response
    } else {
      // Structured response (JSON mode with schema)
      const structuredConfig = config as StructuredCompletionConfig<T>

      // Convert Zod schema to JSON Schema
      let jsonSchema: any = zodToJsonSchema(structuredConfig.schema, {
        $refStrategy: 'none'
      })

      // OpenAI requires the schema to be a direct object, not a reference
      // If zod-to-json-schema generated a $ref, extract the actual schema
      if (jsonSchema.$ref && jsonSchema.definitions) {
        const refKey = jsonSchema.$ref.replace('#/definitions/', '')
        jsonSchema = jsonSchema.definitions[refKey]
      }

      // Remove $schema as OpenAI doesn't need it
      delete jsonSchema.$schema

      console.log('Cleaned JSON Schema:', JSON.stringify(jsonSchema, null, 2))

      const completion = await openai.chat.completions.create({
        model: finalConfig.model,
        temperature: finalConfig.temperature,
        top_p: finalConfig.topP,
        max_tokens: finalConfig.maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: structuredConfig.schemaName,
            description: structuredConfig.schemaDescription,
            schema: jsonSchema,
            strict: false  // Disable strict mode to allow optional fields
          }
        }
      })

      const responseContent = completion.choices[0]?.message?.content || '{}'
      const parsed = JSON.parse(responseContent)

      // Validate with Zod
      const validated = structuredConfig.schema.parse(parsed)
      return validated as z.infer<T>
    }
  } catch (error) {
    console.error('LLM completion error:', error)

    // Graceful fallback (AI Chef pattern)
    if (config.schema instanceof z.ZodString) {
      return 'I apologize, but I encountered an error processing your request. Please try again.'
    } else {
      // For structured responses, throw the error (caller handles it)
      throw error
    }
  }
}

// ============================================================================
// Convenience: Simple string completion
// ============================================================================

export async function callStringCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: Partial<StringCompletionConfig>
): Promise<string> {
  return callCompletion(
    { systemPrompt, userPrompt },
    {
      schema: z.string(),
      ...options
    }
  )
}

// ============================================================================
// Convenience: Structured completion
// ============================================================================

export async function callStructuredCompletion<T extends z.ZodType>(
  systemPrompt: string,
  userPrompt: string,
  schema: T,
  schemaName: string,
  schemaDescription: string,
  options?: Partial<BaseLLMConfig>
): Promise<z.infer<T>> {
  return callCompletion(
    { systemPrompt, userPrompt },
    {
      schema,
      schemaName,
      schemaDescription,
      ...options
    }
  )
}
