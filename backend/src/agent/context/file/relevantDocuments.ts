interface Document {
  id: string
  title: string
  content: string
  projectId: string | null
}

/**
 * Get relevant documents (project-scoped)
 * MVP: Returns recent documents from same project
 * Following AI Chef pattern of parallel retrieval
 */
export function getRelevantDocuments(
  currentProjectId: string | undefined,
  currentDocumentId: string | undefined,
  documents: Document[]
): Array<{ id: string; title: string; content: string }> {
  // Filter to current project (or null project if no project selected)
  const projectDocuments = documents.filter(doc => {
    // Exclude the current document
    if (doc.id === currentDocumentId) return false

    // Match project ID
    return doc.projectId === (currentProjectId || null)
  })

  // Sort by most recent (assuming IDs contain timestamps or have natural ordering)
  // For MVP, take top 5 most recent
  const MAX_RELEVANT = 5

  const relevant = projectDocuments
    .slice(0, MAX_RELEVANT)
    .map(doc => ({
      id: doc.id,
      title: doc.title,
      content: extractPlainText(doc.content)
    }))

  return relevant
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
