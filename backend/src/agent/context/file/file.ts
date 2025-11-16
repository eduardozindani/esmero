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

interface Project {
  id: string
  name: string
}

interface FileContextInput {
  userMessage: string  // User's current message (for relevance filtering)
  selectedText: string | undefined
  canvasContent: string  // Live canvas content (HTML)
  currentDocumentId: string | undefined
  currentProjectId: string | undefined
  documents: Document[]
  projects: Project[]
}

/**
 * Determine file context
 * Following AI Chef orchestration pattern with parallel execution
 */
export async function determineFile(input: FileContextInput): Promise<FileContext> {
  try {
    const {
      userMessage,
      selectedText,
      canvasContent,
      currentDocumentId,
      currentProjectId,
      documents,
      projects
    } = input

    // Execute in parallel (AI Chef pattern)
    // Now includes intelligent LLM-based filtering for relevance
    const [selection, currentPage, projectDocuments] = await Promise.all([
      Promise.resolve(getCurrentSelection(selectedText)),
      Promise.resolve(getCurrentPage(canvasContent, currentDocumentId, documents)),
      getRelevantDocuments(userMessage, currentProjectId, currentDocumentId, documents, projects)
    ])

    // Format into structured text for LLM
    const structured = formatStructured(selection, currentPage, projectDocuments, projects)

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
