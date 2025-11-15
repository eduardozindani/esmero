/**
 * Get current selection (focused text user highlighted)
 * Simple extraction - no LLM needed
 */
export function getCurrentSelection(selectedText?: string): string | null {
  if (!selectedText || selectedText.trim().length === 0) {
    return null
  }

  return selectedText.trim()
}
