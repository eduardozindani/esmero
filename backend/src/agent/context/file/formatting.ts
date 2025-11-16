/**
 * Format file context into structured text for LLM prompt
 * Following AI Chef pattern: descriptive, hierarchical, XML-style
 */
export function formatStructured(
  selection: string | null,
  currentPage: { id: string; title: string; content: string } | null,
  relevantDocuments: Array<{ id: string; title: string; content: string; projectId: string | null }>,
  projects: Array<{ id: string; name: string }>
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

  // Project Documents (relevant context) - GROUPED BY PROJECT
  parts.push('<Project_Documents>')
  if (relevantDocuments.length > 0) {
    // Group documents by project
    const docsByProject = new Map<string | null, typeof relevantDocuments>()
    relevantDocuments.forEach(doc => {
      if (!docsByProject.has(doc.projectId)) {
        docsByProject.set(doc.projectId, [])
      }
      docsByProject.get(doc.projectId)!.push(doc)
    })

    // Display each project's documents
    docsByProject.forEach((docs, projectId) => {
      const projectName = projectId
        ? projects.find(p => p.id === projectId)?.name || 'Unknown Project'
        : 'Loose Documents'

      parts.push(`## ${projectName}`)
      parts.push(`${docs.length} document(s):`)
      parts.push('')

      docs.forEach((doc, index) => {
        parts.push(`${index + 1}. ${doc.title}`)
        // Show snippet of content (first 200 chars)
        const snippet = doc.content.length > 200
          ? doc.content.slice(0, 200) + '...'
          : doc.content
        parts.push(`   ${snippet}`)
        parts.push('')
      })
    })
  } else {
    parts.push('No other documents available.')
  }
  parts.push('</Project_Documents>')

  parts.push('</File_Context>')

  const result = parts.join('\n')
  console.log('\n📄 Formatted File Context:')
  console.log(result)
  console.log('\n')

  return result
}
