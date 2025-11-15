/**
 * TipTap Diff Extension
 * Renders inline diffs using TipTap's decoration system
 * Shows old text with red background, new text with green background
 * Includes accept/reject controls inline
 */

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface DiffChunk {
  id: string
  oldText: string
  newText: string
  explanation: string
}

interface DiffState {
  chunks: DiffChunk[]
  decorations: DecorationSet
}

export interface DiffExtensionOptions {
  onAcceptChunk: (chunkId: string) => void
  onRejectChunk: (chunkId: string) => void
}

const DiffPluginKey = new PluginKey<DiffState>('diff')

export const DiffExtension = Extension.create<DiffExtensionOptions>({
  name: 'diff',

  addOptions() {
    return {
      onAcceptChunk: () => {},
      onRejectChunk: () => {},
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin<DiffState>({
        key: DiffPluginKey,

        state: {
          init() {
            return {
              chunks: [],
              decorations: DecorationSet.empty,
            }
          },

          apply(tr, state) {
            // Check if chunks were updated via transaction metadata
            const newChunks = tr.getMeta(DiffPluginKey)

            if (newChunks !== undefined) {
              // Recompute decorations for new chunks
              const decorations = computeDecorations(
                tr.doc,
                newChunks,
                extension.options.onAcceptChunk,
                extension.options.onRejectChunk
              )

              return {
                chunks: newChunks,
                decorations,
              }
            }

            // Map decorations through document changes
            return {
              chunks: state.chunks,
              decorations: state.decorations.map(tr.mapping, tr.doc),
            }
          },
        },

        props: {
          decorations(state) {
            return DiffPluginKey.getState(state)?.decorations
          },
        },
      }),
    ]
  },

  addCommands() {
    return {
      setDiffChunks: (chunks: DiffChunk[]) => ({ tr, dispatch }) => {
        if (dispatch) {
          tr.setMeta(DiffPluginKey, chunks)
        }
        return true
      },
    }
  },
})

/**
 * Find text position in document
 * Returns start and end position if found
 */
function findTextPosition(
  doc: any,
  searchText: string
): { from: number; to: number } | null {
  const docText = doc.textContent
  const index = docText.indexOf(searchText)

  if (index === -1) {
    return null
  }

  return {
    from: index + 1, // ProseMirror positions are 1-indexed
    to: index + searchText.length + 1,
  }
}

/**
 * Compute decorations for all diff chunks
 */
function computeDecorations(
  doc: any,
  chunks: DiffChunk[],
  onAccept: (id: string) => void,
  onReject: (id: string) => void
): DecorationSet {
  const decorations: Decoration[] = []

  for (const chunk of chunks) {
    const position = findTextPosition(doc, chunk.oldText)

    if (!position) {
      console.warn(`Could not find text for chunk ${chunk.id}:`, chunk.oldText)
      continue
    }

    // Decoration 1: Highlight old text with red background
    decorations.push(
      Decoration.inline(position.from, position.to, {
        class: 'diff-deletion',
        style: 'background-color: #fecaca; text-decoration: line-through; border-radius: 2px;',
      })
    )

    // Decoration 2: Widget showing new text and controls
    const widget = createDiffWidget(chunk, onAccept, onReject)
    decorations.push(
      Decoration.widget(position.to, widget, {
        side: 1, // Position after the old text
      })
    )
  }

  return DecorationSet.create(doc, decorations)
}

/**
 * Create DOM widget for diff controls
 */
function createDiffWidget(
  chunk: DiffChunk,
  onAccept: (id: string) => void,
  onReject: (id: string) => void
): HTMLElement {
  const container = document.createElement('span')
  container.className = 'diff-widget'
  container.contentEditable = 'false' // Make it non-editable
  container.style.cssText = `
    display: inline-block;
    margin: 0 4px;
    vertical-align: baseline;
  `

  // New text (green)
  const newText = document.createElement('span')
  newText.className = 'diff-addition'
  newText.textContent = chunk.newText
  newText.style.cssText = `
    background-color: #bbf7d0;
    padding: 2px 4px;
    border-radius: 2px;
    margin-right: 4px;
  `

  // Controls container
  const controls = document.createElement('span')
  controls.style.cssText = `
    display: inline-flex;
    gap: 4px;
    align-items: center;
  `

  // Accept button
  const acceptBtn = document.createElement('button')
  acceptBtn.className = 'diff-accept-btn'
  acceptBtn.dataset.chunkId = chunk.id
  acceptBtn.textContent = '✓'
  acceptBtn.title = chunk.explanation
  acceptBtn.style.cssText = `
    background: #16a34a;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
  `

  // Reject button
  const rejectBtn = document.createElement('button')
  rejectBtn.className = 'diff-reject-btn'
  rejectBtn.dataset.chunkId = chunk.id
  rejectBtn.textContent = '✗'
  rejectBtn.style.cssText = `
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 3px;
    padding: 2px 6px;
    cursor: pointer;
    font-size: 12px;
    line-height: 1;
  `

  controls.appendChild(acceptBtn)
  controls.appendChild(rejectBtn)

  container.appendChild(newText)
  container.appendChild(controls)

  return container
}
