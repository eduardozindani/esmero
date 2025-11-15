interface Document {
  id: string
  title: string
  content: string
  projectId: string | null
}

/**
 * Get current page (the document user is viewing)
 */
export function getCurrentPage(
  currentDocumentId: string | undefined,
  documents: Document[]
): { id: string; title: string; content: string } | null {
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
