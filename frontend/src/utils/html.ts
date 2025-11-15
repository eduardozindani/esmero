/**
 * Extract plain text from HTML string
 * Used for comparing content without HTML markup differences
 */
export function extractTextFromHTML(html: string): string {
  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  // Get text content and normalize whitespace
  return temp.textContent?.trim() || ''
}

/**
 * Check if HTML content is empty (only contains empty tags)
 */
export function isHTMLEmpty(html: string): boolean {
  const text = extractTextFromHTML(html)
  return text.length === 0
}
