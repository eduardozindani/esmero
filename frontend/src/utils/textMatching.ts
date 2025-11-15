/**
 * Text matching utilities for finding agent-provided oldText in canvas
 * Uses fuzzy matching to handle slight differences
 */

import { Editor } from '@tiptap/react'

/**
 * Find text in editor and return position information
 * Uses TipTap's search capabilities
 */
export function findTextInEditor(
  editor: Editor,
  searchText: string
): { from: number; to: number } | null {
  const docText = editor.state.doc.textContent

  // Try exact match first
  const exactIndex = docText.indexOf(searchText)
  if (exactIndex !== -1) {
    return {
      from: exactIndex + 1, // TipTap positions are 1-indexed
      to: exactIndex + searchText.length + 1
    }
  }

  // Try fuzzy match with normalized whitespace
  const normalizedSearch = normalizeWhitespace(searchText)
  const normalizedDoc = normalizeWhitespace(docText)

  const fuzzyIndex = normalizedDoc.indexOf(normalizedSearch)
  if (fuzzyIndex !== -1) {
    // Map back to original document position
    const originalPos = mapNormalizedToOriginal(docText, fuzzyIndex, searchText.length)
    if (originalPos) {
      return {
        from: originalPos.from + 1,
        to: originalPos.to + 1
      }
    }
  }

  return null
}

/**
 * Normalize whitespace for better matching
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim()
}

/**
 * Map position in normalized text back to original text
 */
function mapNormalizedToOriginal(
  originalText: string,
  normalizedIndex: number,
  length: number
): { from: number; to: number } | null {
  let originalIndex = 0
  let normalizedPos = 0

  // Walk through original text tracking normalized position
  for (let i = 0; i < originalText.length; i++) {
    const char = originalText[i]

    // Skip leading whitespace in original
    if (normalizedPos === 0 && /\s/.test(char)) {
      originalIndex++
      continue
    }

    // Check if we've reached the target position
    if (normalizedPos === normalizedIndex) {
      const from = originalIndex

      // Find end position
      let remainingLength = length
      let currentPos = i

      while (remainingLength > 0 && currentPos < originalText.length) {
        if (!/\s/.test(originalText[currentPos]) ||
            (currentPos + 1 < originalText.length && /\s/.test(originalText[currentPos + 1]))) {
          remainingLength--
        }
        currentPos++
      }

      return { from, to: currentPos }
    }

    // Advance normalized position
    if (/\s/.test(char)) {
      // Collapse whitespace in normalized version
      if (normalizedPos > 0 && originalText[i - 1] && !/\s/.test(originalText[i - 1])) {
        normalizedPos++
      }
    } else {
      normalizedPos++
    }

    originalIndex++
  }

  return null
}

/**
 * Calculate similarity between two strings (0-1, where 1 is identical)
 * Using Levenshtein distance for fuzzy matching
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1

  if (longer.length === 0) {
    return 1.0
  }

  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}
