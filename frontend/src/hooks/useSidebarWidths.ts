import { useState, useEffect } from 'react'

const SIDEBAR_WIDTHS_KEY = 'esmero_sidebar_widths'

interface SidebarWidths {
  left: number
  right: number
}

const DEFAULT_WIDTHS: SidebarWidths = {
  left: 256,  // w-64
  right: 384  // w-96
}

export const useSidebarWidths = () => {
  const [widths, setWidths] = useState<SidebarWidths>(DEFAULT_WIDTHS)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_WIDTHS_KEY)
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
    try {
      localStorage.setItem(SIDEBAR_WIDTHS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save sidebar widths:', error)
    }
  }

  return [widths, updateWidths] as const
}