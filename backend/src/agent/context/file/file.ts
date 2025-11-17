import type { FileContext } from '../../../agent/types.js'
import { getCurrentSelection } from './selection.js'
import { getCurrentPage } from './currentPage.js'
import { getRelevantDocuments } from './relevantDocuments.js'
import { formatStructured } from './formatting.js'

interface Document {
  id: string
  title: string
  content: string
  folderId: string | null
}

interface Folder {
  id: string
  name: string
}

interface FileContextInput {
  userMessage: string  // User's current message (for relevance filtering)
  selectedText: string | undefined
  canvasContent: string  // Live canvas content (HTML)
  currentDocumentId: string | undefined
  currentFolderId: string | undefined
  documents: Document[]
  folders: Folder[]
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
      currentFolderId,
      documents,
      folders
    } = input

    // Execute in parallel (AI Chef pattern)
    // Now includes intelligent LLM-based filtering for relevance
    const [selection, currentPage, folderDocuments] = await Promise.all([
      Promise.resolve(getCurrentSelection(selectedText)),
      Promise.resolve(getCurrentPage(canvasContent, currentDocumentId, documents)),
      getRelevantDocuments(userMessage, currentFolderId, currentDocumentId, documents, folders)
    ])

    // Format into structured text for LLM
    const structured = formatStructured(selection, currentPage, folderDocuments, folders)

    return {
      currentSelection: selection,
      currentPage,
      folderDocuments,
      structured
    }
  } catch (error) {
    console.error('Error determining file context:', error)

    // Graceful fallback (AI Chef pattern)
    return {
      currentSelection: null,
      currentPage: null,
      folderDocuments: [],
      structured: '<File_Context>\n[Error loading file context]\n</File_Context>'
    }
  }
}
