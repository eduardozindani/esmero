interface Document {
  id: string
  title: string
  content: string
  projectId: string | null
}

/**
 * Get current page (the document user is viewing/editing)
 * Uses live canvas content if available, otherwise falls back to saved document
 */
export function getCurrentPage(
  canvasContent: string,
  currentDocumentId: string | undefined,
  documents: Document[]
): { id: string; title: string; content: string } | null {
  // If canvas has content, use that (it's what the user is actively editing)
  if (canvasContent && canvasContent.trim().length > 0) {
    const plainText = extractPlainText(canvasContent)

    // If there's a current document, use its ID and title
    if (currentDocumentId) {
      const document = documents.find(doc => doc.id === currentDocumentId)
      return {
        id: currentDocumentId,
        title: document?.title || 'Untitled',
        content: plainText
      }
    }

    // Otherwise, it's a new unsaved document
    return {
      id: 'new',
      title: 'New Document',
      content: plainText
    }
  }

  // Fallback: If canvas is empty, use saved document
  if (!currentDocumentId) {
    return null
  }

  const document = documents.find(doc => doc.id === currentDocumentId)

  if (!document) {
    return null
  }

  // Extract plain text from HTML content
  const plainText = extractPlainText(document.content)

  return {
    id: document.id,
    title: document.title,
    content: plainText
  }
}

/**
 * Helper: Extract plain text from HTML
 */
function extractPlainText(html: string): string {
  if (!html) return ''

  // Simple regex-based HTML tag removal
  // For production, consider using a proper HTML parser
  return html
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/&nbsp;/g, ' ')   // Replace &nbsp;
    .replace(/&amp;/g, '&')    // Replace &amp;
    .replace(/&lt;/g, '<')     // Replace &lt;
    .replace(/&gt;/g, '>')     // Replace &gt;
    .replace(/&quot;/g, '"')   // Replace &quot;
    .replace(/&#39;/g, "'")    // Replace &#39;
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim()
}
