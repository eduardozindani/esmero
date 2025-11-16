import { filterRelevantProjects, filterRelevantDocuments } from './relevance.js'

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

/**
 * Get relevant documents with intelligent LLM-based filtering
 * Following AI Chef pattern: parallel execution + smart relevance
 *
 * Strategy:
 * 1. Filter projects (if > 5) - parallel
 * 2. Filter loose documents (if > 5) - parallel with #1
 * 3. For each selected project, filter documents (if > 5) - all parallel
 */
export async function getRelevantDocuments(
  userMessage: string,
  currentProjectId: string | undefined,
  currentDocumentId: string | undefined,
  documents: Document[],
  projects: Project[]
): Promise<Array<{ id: string; title: string; content: string; projectId: string | null }>> {
  try {
    console.log('\n📚 Getting relevant documents:')
    console.log('  Total documents:', documents.length)
    console.log('  Current project:', currentProjectId)
    console.log('  Current document:', currentDocumentId)
    console.log('  Projects:', projects.length)

    // Separate documents into loose (no project) and project-scoped
    const looseDocuments = documents.filter(doc =>
      doc.projectId === null && doc.id !== currentDocumentId
    )

    // Group documents by project
    const documentsByProject = new Map<string, Document[]>()
    documents.forEach(doc => {
      if (doc.projectId && doc.id !== currentDocumentId) {
        if (!documentsByProject.has(doc.projectId)) {
          documentsByProject.set(doc.projectId, [])
        }
        documentsByProject.get(doc.projectId)!.push(doc)
      }
    })

    console.log('  Loose documents:', looseDocuments.length)
    console.log('  Project documents:', Array.from(documentsByProject.entries()).map(([id, docs]) => `${id}: ${docs.length}`).join(', '))

    // ========================================================================
    // SPECIAL CASE: If no current project, include ALL projects' documents
    // This ensures documents are available even when canvas isn't in a project
    // ========================================================================
    const projectsToFilter = currentProjectId ? projects.filter(p => p.id === currentProjectId) : projects

    // ========================================================================
    // PARALLEL EXECUTION: Filter projects AND loose documents simultaneously
    // ========================================================================

    const [relevantProjectIds, relevantLooseDocIds] = await Promise.all([
      // Filter projects (if > 5)
      filterRelevantProjects(projectsToFilter, userMessage),

      // Filter loose documents (if > 5)
      filterRelevantDocuments(
        looseDocuments.map(d => ({ id: d.id, title: d.title })),
        userMessage,
        'loose documents'
      )
    ])

    // ========================================================================
    // PARALLEL EXECUTION: Filter documents within each selected project
    // ========================================================================

    const projectDocumentFilterPromises = relevantProjectIds.map(async projectId => {
      const projectDocs = documentsByProject.get(projectId) || []

      // Filter documents within this project (if > 5)
      const relevantDocIds = await filterRelevantDocuments(
        projectDocs.map(d => ({ id: d.id, title: d.title })),
        userMessage,
        `documents in project ${projects.find(p => p.id === projectId)?.name || projectId}`
      )

      return projectDocs.filter(doc => relevantDocIds.includes(doc.id))
    })

    const projectDocumentsArrays = await Promise.all(projectDocumentFilterPromises)

    // ========================================================================
    // Combine results
    // ========================================================================

    // Get actual loose documents
    const selectedLooseDocs = looseDocuments.filter(doc =>
      relevantLooseDocIds.includes(doc.id)
    )

    // Flatten project documents
    const selectedProjectDocs = projectDocumentsArrays.flat()

    // Combine and return
    const allRelevantDocs = [...selectedLooseDocs, ...selectedProjectDocs]

    console.log('  ✅ Selected documents:', allRelevantDocs.length)
    console.log('  Titles:', allRelevantDocs.map(d => d.title).join(', '))

    return allRelevantDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: extractPlainText(doc.content),
      projectId: doc.projectId  // Include project ID so we can show project names
    }))

  } catch (error) {
    console.error('Error getting relevant documents:', error)

    // Graceful fallback: return first 5 documents from current project
    const fallbackDocs = documents
      .filter(doc => {
        if (doc.id === currentDocumentId) return false
        return doc.projectId === (currentProjectId || null)
      })
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        title: doc.title,
        content: extractPlainText(doc.content),
        projectId: doc.projectId
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
