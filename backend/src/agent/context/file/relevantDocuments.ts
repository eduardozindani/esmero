import { filterRelevantFolders, filterRelevantDocuments } from './relevance.js'

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

/**
 * Get relevant documents with intelligent LLM-based filtering
 * Following AI Chef pattern: parallel execution + smart relevance
 *
 * Strategy:
 * 1. Filter folders (if > 5) - parallel
 * 2. Filter loose documents (if > 5) - parallel with #1
 * 3. For each selected folder, filter documents (if > 5) - all parallel
 */
export async function getRelevantDocuments(
  userMessage: string,
  currentFolderId: string | undefined,
  currentDocumentId: string | undefined,
  documents: Document[],
  folders: Folder[]
): Promise<Array<{ id: string; title: string; content: string; folderId: string | null }>> {
  try {
    console.log('\n📚 Getting relevant documents:')
    console.log('  Total documents:', documents.length)
    console.log('  Current folder:', currentFolderId)
    console.log('  Current document:', currentDocumentId)
    console.log('  Folders:', folders.length)

    // Separate documents into loose (no folder) and folder-scoped
    const looseDocuments = documents.filter(doc =>
      doc.folderId === null && doc.id !== currentDocumentId
    )

    // Group documents by folder
    const documentsByFolder = new Map<string, Document[]>()
    documents.forEach(doc => {
      if (doc.folderId && doc.id !== currentDocumentId) {
        if (!documentsByFolder.has(doc.folderId)) {
          documentsByFolder.set(doc.folderId, [])
        }
        documentsByFolder.get(doc.folderId)!.push(doc)
      }
    })

    console.log('  Loose documents:', looseDocuments.length)
    console.log('  Folder documents:', Array.from(documentsByFolder.entries()).map(([id, docs]) => `${id}: ${docs.length}`).join(', '))

    // ========================================================================
    // SPECIAL CASE: If no current folder, include ALL folders' documents
    // This ensures documents are available even when canvas isn't in a folder
    // ========================================================================
    const foldersToFilter = currentFolderId ? folders.filter(f => f.id === currentFolderId) : folders

    // ========================================================================
    // PARALLEL EXECUTION: Filter folders AND loose documents simultaneously
    // ========================================================================

    const [relevantFolderIds, relevantLooseDocIds] = await Promise.all([
      // Filter folders (if > 5)
      filterRelevantFolders(foldersToFilter, userMessage),

      // Filter loose documents (if > 5)
      filterRelevantDocuments(
        looseDocuments.map(d => ({ id: d.id, title: d.title })),
        userMessage,
        'loose documents'
      )
    ])

    // ========================================================================
    // PARALLEL EXECUTION: Filter documents within each selected folder
    // ========================================================================

    const folderDocumentFilterPromises = relevantFolderIds.map(async folderId => {
      const folderDocs = documentsByFolder.get(folderId) || []

      // Filter documents within this folder (if > 5)
      const relevantDocIds = await filterRelevantDocuments(
        folderDocs.map(d => ({ id: d.id, title: d.title })),
        userMessage,
        `documents in folder ${folders.find(f => f.id === folderId)?.name || folderId}`
      )

      return folderDocs.filter(doc => relevantDocIds.includes(doc.id))
    })

    const folderDocumentsArrays = await Promise.all(folderDocumentFilterPromises)

    // ========================================================================
    // Combine results
    // ========================================================================

    // Get actual loose documents
    const selectedLooseDocs = looseDocuments.filter(doc =>
      relevantLooseDocIds.includes(doc.id)
    )

    // Flatten folder documents
    const selectedFolderDocs = folderDocumentsArrays.flat()

    // Combine and return
    const allRelevantDocs = [...selectedLooseDocs, ...selectedFolderDocs]

    console.log('  ✅ Selected documents:', allRelevantDocs.length)
    console.log('  Titles:', allRelevantDocs.map(d => d.title).join(', '))

    return allRelevantDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: extractPlainText(doc.content),
      folderId: doc.folderId  // Include folder ID so we can show folder names
    }))

  } catch (error) {
    console.error('Error getting relevant documents:', error)

    // Graceful fallback: return first 5 documents from current folder
    const fallbackDocs = documents
      .filter(doc => {
        if (doc.id === currentDocumentId) return false
        return doc.folderId === (currentFolderId || null)
      })
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        content: extractPlainText(doc.content),
        folderId: doc.folderId
      }))

    return fallbackDocs
  }
}

/**
 * Helper: Extract plain text from HTML
 */
function extractPlainText(html: string): string {
  if (!html) return ''

  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
