import { useState } from 'react'
import { STORAGE_KEYS, SIDEBAR_CONSTRAINTS } from '../constants/ui'

interface SidebarWidths {
  left: number
  right: number
}

const getInitialWidths = (): SidebarWidths => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTHS)
    if (stored) {
      const parsed = JSON.parse(stored)
      let left = Math.max(parsed.left || SIDEBAR_CONSTRAINTS.DEFAULT_LEFT_WIDTH, SIDEBAR_CONSTRAINTS.MIN_WIDTH)
      let right = Math.max(parsed.right || SIDEBAR_CONSTRAINTS.DEFAULT_RIGHT_WIDTH, SIDEBAR_CONSTRAINTS.MIN_WIDTH)

      // Validate that combined widths don't exceed viewport
      // Leave room for minimum canvas width
      const maxCombined = window.innerWidth - SIDEBAR_CONSTRAINTS.MIN_CANVAS_WIDTH
      if (left + right > maxCombined) {
        // Reset to defaults if corrupted
        left = SIDEBAR_CONSTRAINTS.DEFAULT_LEFT_WIDTH
        right = SIDEBAR_CONSTRAINTS.DEFAULT_RIGHT_WIDTH
      }

      return { left, right }
    }
  } catch (error) {
    console.error('Failed to load sidebar widths:', error)
  }

  return {
    left: SIDEBAR_CONSTRAINTS.DEFAULT_LEFT_WIDTH,
    right: SIDEBAR_CONSTRAINTS.DEFAULT_RIGHT_WIDTH
  }
}

export const useSidebarWidths = () => {
  const [widths, setWidths] = useState<SidebarWidths>(getInitialWidths)

  const updateWidths = (newWidths: Partial<SidebarWidths>) => {
    console.log('[useSidebarWidths] updateWidths called with:', newWidths)
    const updated = { ...widths, ...newWidths }
    console.log('[useSidebarWidths] Setting widths to:', updated)
    setWidths(updated)

    // Persist to localStorage immediately
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_WIDTHS, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save sidebar widths:', error)
    }
  }

  return [widths, updateWidths] as const
}