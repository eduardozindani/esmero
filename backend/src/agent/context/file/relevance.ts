import { z } from 'zod'
import { callCompletion } from '../../../utils/llm.js'

/**
 * Intelligent relevance filtering using LLM
 * Following AI Chef pattern: only invoke LLM when needed (> 5 items)
 * Filter based on titles to save tokens
 */

// ============================================================================
// Schemas for LLM responses
// ============================================================================

const ProjectRelevanceSchema = z.object({
  relevantProjectIds: z.array(z.string())
    .max(5)
    .describe('IDs of up to 5 most relevant projects based on user question')
})

const DocumentRelevanceSchema = z.object({
  relevantDocumentIds: z.array(z.string())
    .max(5)
    .describe('IDs of up to 5 most relevant documents based on user question')
})

// ============================================================================
// Filter Projects
// ============================================================================

interface Project {
  id: string
  name: string
}

export async function filterRelevantProjects(
  projects: Project[],
  userMessage: string
): Promise<string[]> {
  const MAX_WITHOUT_LLM = 5

  // If 5 or fewer projects, return all
  if (projects.length <= MAX_WITHOUT_LLM) {
    return projects.map(p => p.id)
  }

  // Use LLM to select most relevant
  const systemPrompt = `You are helping determine which projects are relevant to a user's question.
You will be given a list of project names and the user's current message.
Select up to 5 projects that are most likely relevant to their question.`

  const projectList = projects
    .map(p => `- ${p.id}: ${p.name}`)
    .join('\n')

  const userPrompt = `User's message: "${userMessage}"

Available projects:
${projectList}

Which projects are most relevant to this message? Return their IDs.`

  try {
    const result = await callCompletion(
      { systemPrompt, userPrompt },
      {
        schema: ProjectRelevanceSchema,
        schemaName: 'project_relevance',
        schemaDescription: 'Selected relevant projects',
        model: 'gpt-4.1-mini',
        temperature: 0.3,
        maxTokens: 200
      }
    )

    return result.relevantProjectIds
  } catch (error) {
    console.error('Error filtering projects:', error)
    // Fallback: return first 5
    return projects.slice(0, MAX_WITHOUT_LLM).map(p => p.id)
  }
}

// ============================================================================
// Filter Documents
// ============================================================================

interface Document {
  id: string
  title: string
}

export async function filterRelevantDocuments(
  documents: Document[],
  userMessage: string,
  contextLabel: string = 'documents'
): Promise<string[]> {
  const MAX_WITHOUT_LLM = 5

  // If 5 or fewer documents, return all
  if (documents.length <= MAX_WITHOUT_LLM) {
    return documents.map(d => d.id)
  }

  // Use LLM to select most relevant
  const systemPrompt = `You are helping determine which documents are relevant to a user's question.
You will be given a list of document titles and the user's current message.
Select up to 5 documents that are most likely relevant to their question.`

  const documentList = documents
    .map(d => `- ${d.id}: ${d.title}`)
    .join('\n')

  const userPrompt = `User's message: "${userMessage}"

Available ${contextLabel}:
${documentList}

Which documents are most relevant to this message? Return their IDs.`

  try {
    const result = await callCompletion(
      { systemPrompt, userPrompt },
      {
        schema: DocumentRelevanceSchema,
        schemaName: 'document_relevance',
        schemaDescription: 'Selected relevant documents',
        model: 'gpt-4.1-mini',
        temperature: 0.3,
        maxTokens: 200
      }
    )

    return result.relevantDocumentIds
  } catch (error) {
    console.error('Error filtering documents:', error)
    // Fallback: return first 5
    return documents.slice(0, MAX_WITHOUT_LLM).map(d => d.id)
  }
}
