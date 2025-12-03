/**
 * UI Constants for consistent behavior across the application
 * These values control the visual and interactive aspects of the UI
 */

// Sidebar trigger zones
export const SIDEBAR_TRIGGERS = {
  // Width of the hover zone to open collapsed sidebars (in pixels)
  OPEN_ZONE_WIDTH: 20,

  // Width of the hover zone to collapse expanded sidebars (in pixels)
  // This extends beyond the sidebar boundary for easier access
  CLOSE_ZONE_WIDTH: 20,

  // Visual indicator dimensions
  INDICATOR_HEIGHT: 16,
  INDICATOR_WIDTH: 8,
} as const

// Resize handle configuration
export const RESIZE_HANDLE = {
  // Total width of the interactive resize area (in pixels)
  HOVER_ZONE_WIDTH: 8,

  // Visual line widths for different states (in pixels)
  LINE_WIDTH_DEFAULT: 1,
  LINE_WIDTH_HOVER: 2,
  LINE_WIDTH_DRAGGING: 3,

  // Colors with opacity for different states
  COLOR_HOVER: 'rgba(156, 163, 175, 0.3)',     // gray-400 with 30% opacity
  COLOR_DRAGGING: 'rgba(107, 114, 128, 0.5)',  // gray-500 with 50% opacity

  // Positioning offset from sidebar edge
  POSITION_OFFSET: 2,
} as const

// Sidebar constraints
export const SIDEBAR_CONSTRAINTS = {
  // Minimum width for sidebars (in pixels)
  MIN_WIDTH: 180,

  // Minimum width for the center canvas (in pixels)
  MIN_CANVAS_WIDTH: 400,

  // Maximum width as percentage of viewport
  MAX_WIDTH_PERCENT: 0.5,

  // Default widths (in pixels)
  DEFAULT_LEFT_WIDTH: 256,   // w-64 in Tailwind
  DEFAULT_RIGHT_WIDTH: 384,  // w-96 in Tailwind

  // Edge offset when maximized (keeps resize handle accessible)
  MAXIMIZE_EDGE_OFFSET: 20,
} as const

// Animation durations
export const ANIMATIONS = {
  // Sidebar open/close transition (in ms)
  SIDEBAR_TRANSITION: 300,

  // Resize handle visual feedback (in ms)
  RESIZE_FEEDBACK: 200,

  // Title generation animation (in ms)
  TITLE_FADE_IN: 300,

  // Title generation timeout (in ms)
  TITLE_GENERATION_TIMEOUT: 10000,

  // Document appearance animation (in ms)
  DOCUMENT_SLIDE_IN: 300,

  // Document deletion animation (in ms)
  DOCUMENT_SLIDE_OUT: 250,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  DOCUMENTS: 'esmero_documents',
  FOLDERS: 'esmero_folders',
  SIDEBAR_WIDTHS: 'esmero_sidebar_widths',

  // Legacy keys for migration
  OLD_PROJECTS: 'esmero_projects',
} as const