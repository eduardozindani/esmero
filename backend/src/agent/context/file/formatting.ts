/**
 * Format file context into structured text for LLM prompt
 * Following AI Chef pattern: descriptive, hierarchical, XML-style
 */
export function formatStructured(
  selection: string | null,
  currentPage: { id: string; title: string; content: string } | null,
  relevantDocuments: Array<{ id: string; title: string; content: string }>
): string {
  const parts: string[] = []

  parts.push('<File_Context>')
  parts.push('')

  // Current Selection (focused context)
  parts.push('<Current_Selection>')
  if (selection) {
    parts.push(`User has selected the following text:\n"${selection}"`)
  } else {
    parts.push('No text currently selected.')
  }
  parts.push('</Current_Selection>')
  parts.push('')

  // Current Page (document user is viewing)
  parts.push('<Current_Page>')
  if (currentPage) {
    parts.push(`Title: ${currentPage.title}`)
    parts.push('')
    parts.push('Content:')
    // Truncate very long content
    const content = currentPage.content.length > 3000
      ? currentPage.content.slice(0, 3000) + '... [content truncated]'
      : currentPage.content
    parts.push(content)
  } else {
    parts.push('No document currently open.')
  }
  parts.push('</Current_Page>')
  parts.push('')

  // Project Documents (relevant context)
  parts.push('<Project_Documents>')
  if (relevantDocuments.length > 0) {
    parts.push(`${relevantDocuments.length} other document(s) in this project:`)
    parts.push('')
    relevantDocuments.forEach((doc, index) => {
      parts.push(`${index + 1}. ${doc.title}`)
      // Show snippet of content (first 200 chars)
      const snippet = doc.content.length > 200
        ? doc.content.slice(0, 200) + '...'
        : doc.content
      parts.push(`   ${snippet}`)
      parts.push('')
    })
  } else {
    parts.push('No other documents in this project.')
  }
  parts.push('</Project_Documents>')

  parts.push('</File_Context>')

  return parts.join('\n')
}
