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

const FolderRelevanceSchema = z.object({
  relevantFolderIds: z.array(z.string())
    .max(5)
    .describe('IDs of up to 5 most relevant folders based on user question')
})

const DocumentRelevanceSchema = z.object({
  relevantDocumentIds: z.array(z.string())
    .max(5)
    .describe('IDs of up to 5 most relevant documents based on user question')
})

// ============================================================================
// Filter Folders
// ============================================================================

interface Folder {
  id: string
  name: string
}

export async function filterRelevantFolders(
  folders: Folder[],
  userMessage: string
): Promise<string[]> {
  const MAX_WITHOUT_LLM = 5

  // If 5 or fewer folders, return all
  if (folders.length <= MAX_WITHOUT_LLM) {
    return folders.map(f => f.id)
  }

  // Use LLM to select most relevant
  const systemPrompt = `You are helping determine which folders are relevant to a user's question.
You will be given a list of folder names and the user's current message.
Select up to 5 folders that are most likely relevant to their question.`

  const folderList = folders
    .map(f => `- ${f.id}: ${f.name}`)
    .join('\n')

  const userPrompt = `User's message: "${userMessage}"

Available folders:
${folderList}

Which folders are most relevant to this message? Return their IDs.`

  try {
    const result = await callCompletion(
      { systemPrompt, userPrompt },
      {
        schema: FolderRelevanceSchema,
        schemaName: 'folder_relevance',
        schemaDescription: 'Selected relevant folders',
        model: 'gpt-4.1-mini',
        temperature: 0.3,
        maxTokens: 200
      }
    )

    return result.relevantFolderIds
  } catch (error) {
    console.error('Error filtering folders:', error)
    // Fallback: return first 5
    return folders.slice(0, MAX_WITHOUT_LLM).map(f => f.id)
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
