import OpenAI from 'openai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import type { LLMContext } from '../agent/types.js'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface StreamingConfig<T extends z.ZodType> {
  schema: T
  schemaName: string
  schemaDescription: string
  model?: string
  temperature?: number
  maxTokens?: number
  onChunk?: (chunk: Partial<z.infer<T>>) => void  // Called for each partial update
  onComplete?: (final: z.infer<T>) => void  // Called when stream completes
  onError?: (error: Error) => void
}

/**
 * Stream structured completion from OpenAI
 * Returns async generator that yields partial results as they arrive
 */
export async function* streamStructuredCompletion<T extends z.ZodType>(
  context: LLMContext,
  config: StreamingConfig<T>
): AsyncGenerator<string, void, unknown> {
  const { systemPrompt, userPrompt } = context

  // Convert Zod schema to JSON Schema
  let jsonSchema: any = zodToJsonSchema(config.schema, {
    $refStrategy: 'none'
  })

  // OpenAI requires the schema to be a direct object, not a reference
  if (jsonSchema.$ref && jsonSchema.definitions) {
    const refKey = jsonSchema.$ref.replace('#/definitions/', '')
    jsonSchema = jsonSchema.definitions[refKey]
  }

  // Remove $schema as OpenAI doesn't need it
  delete jsonSchema.$schema

  try {
    const stream = await openai.chat.completions.create({
      model: config.model || 'gpt-4.1',
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 4000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: config.schemaName,
          description: config.schemaDescription,
          schema: jsonSchema,
          strict: false
        }
      },
      stream: true  // Enable streaming
    })

    // Accumulate the streamed content
    let accumulatedContent = ''

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content

      if (delta) {
        accumulatedContent += delta

        // Yield the raw delta for SSE transmission
        yield delta
      }
    }

    // Validate final result with Zod
    try {
      const parsed = JSON.parse(accumulatedContent)
      const validated = config.schema.parse(parsed)

      // Call completion callback if provided
      if (config.onComplete) {
        config.onComplete(validated)
      }
    } catch (error) {
      console.error('Failed to validate final streamed response:', error)
      if (config.onError) {
        config.onError(error as Error)
      }
    }

  } catch (error) {
    console.error('Streaming error:', error)
    if (config.onError) {
      config.onError(error as Error)
    }
    throw error
  }
}

/**
 * Helper: Parse partial JSON and extract completed chunks
 * Returns array of newly completed chunks since last call
 */
export function extractCompletedChunks(
  partialJSON: string,
  lastExtractedCount: number
): { chunks: any[], newCount: number } {
  try {
    // Attempt to parse partial JSON
    // This is tricky - we need to handle incomplete JSON gracefully

    // Strategy: Try to extract the chunks array even from incomplete JSON
    // Look for completed chunk objects within the partial response

    const chunksMatch = partialJSON.match(/"chunks"\s*:\s*\[([\s\S]*)\]/)
    if (!chunksMatch) {
      return { chunks: [], newCount: lastExtractedCount }
    }

    // Try to parse the chunks array
    const chunksArrayStr = `[${chunksMatch[1]}]`

    // Attempt to parse - if it fails, the JSON is still incomplete
    try {
      const parsed = JSON.parse(chunksArrayStr)
      const newChunks = parsed.slice(lastExtractedCount)
      return { chunks: newChunks, newCount: parsed.length }
    } catch {
      // JSON still incomplete, return what we had before
      return { chunks: [], newCount: lastExtractedCount }
    }

  } catch (error) {
    return { chunks: [], newCount: lastExtractedCount }
  }
}
