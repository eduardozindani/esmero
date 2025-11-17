import { useState, useEffect } from 'react'
import { STORAGE_KEYS, SIDEBAR_CONSTRAINTS } from '../constants/ui'

interface SidebarWidths {
  left: number
  right: number
}

const DEFAULT_WIDTHS: SidebarWidths = {
  left: SIDEBAR_CONSTRAINTS.DEFAULT_LEFT_WIDTH,
  right: SIDEBAR_CONSTRAINTS.DEFAULT_RIGHT_WIDTH
}

export const useSidebarWidths = () => {
  const [widths, setWidths] = useState<SidebarWidths>(DEFAULT_WIDTHS)

  // Load persisted sidebar widths on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SIDEBAR_WIDTHS)
      if (stored) {
        const parsed = JSON.parse(stored)
        setWidths({
          left: parsed.left || DEFAULT_WIDTHS.left,
          right: parsed.right || DEFAULT_WIDTHS.right
        })
      }
    } catch (error) {
      console.error('Failed to load sidebar widths:', error)
    }
  }, [])

  const updateWidths = (newWidths: Partial<SidebarWidths>) => {
    const updated = { ...widths, ...newWidths }
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