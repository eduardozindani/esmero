interface Document {
  id: string
  title: string
  content: string
  folderId: string | null
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
  // Extract plain text from canvas content (if any)
  const canvasPlainText = canvasContent ? extractPlainText(canvasContent) : ''

  // If canvas has content (even if empty), prioritize it
  if (canvasContent !== undefined && canvasContent !== null) {
    // If there's a current document, use its ID and title
    if (currentDocumentId) {
      const document = documents.find(doc => doc.id === currentDocumentId)
      return {
        id: currentDocumentId,
        title: document?.title || 'Untitled',
        content: canvasPlainText
      }
    }

    // Otherwise, it's a blank canvas (new document)
    return {
      id: 'new',
      title: 'Blank Canvas',
      content: canvasPlainText
    }
  }

  // Fallback: Use saved document only if canvas doesn't exist
  if (currentDocumentId) {
    const document = documents.find(doc => doc.id === currentDocumentId)
    if (document) {
      return {
        id: document.id,
        title: document.title,
        content: extractPlainText(document.content)
      }
    }
  }

  // Last resort: No canvas, no document - return null
  return null
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
