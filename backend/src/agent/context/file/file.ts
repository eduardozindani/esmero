import type { FileContext } from '../../../agent/types.js'
import { getCurrentSelection } from './selection.js'
import { getCurrentPage } from './currentPage.js'
import { getRelevantDocuments } from './relevantDocuments.js'
import { formatStructured } from './formatting.js'

interface Document {
  id: string
  title: string
  content: string
  projectId: string | null
}

interface FileContextInput {
  selectedText?: string
  currentDocumentId?: string
  currentProjectId?: string
  documents: Document[]
}

/**
 * Determine file context
 * Following AI Chef orchestration pattern with parallel execution
 */
export async function determineFile(input: FileContextInput): Promise<FileContext> {
  try {
    const {
      selectedText,
      currentDocumentId,
      currentProjectId,
      documents
    } = input

    // Execute in parallel (AI Chef pattern)
    // Note: These are synchronous, but structured for future async operations
    const [selection, currentPage, projectDocuments] = await Promise.all([
      Promise.resolve(getCurrentSelection(selectedText)),
      Promise.resolve(getCurrentPage(currentDocumentId, documents)),
      Promise.resolve(getRelevantDocuments(currentProjectId, currentDocumentId, documents))
    ])

    // Format into structured text for LLM
    const structured = formatStructured(selection, currentPage, projectDocuments)

    return {
      currentSelection: selection,
      currentPage,
      projectDocuments,
      structured
    }
  } catch (error) {
    console.error('Error determining file context:', error)

    // Graceful fallback (AI Chef pattern)
    return {
      currentSelection: null,
      currentPage: null,
      projectDocuments: [],
      structured: '<File_Context>\n[Error loading file context]\n</File_Context>'
    }
  }
}
