import type { AgentRequest, AgentResponse } from '../types'

const API_BASE_URL = 'http://localhost:3001'

interface GenerateTitleResponse {
  title: string
}

// Helper to extract plain text from HTML
const extractPlainText = (html: string): string => {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent || div.innerText || ''
}

export const generateTitle = async (content: string): Promise<string> => {
  try {
    // Extract plain text from HTML for title generation
    const plainText = extractPlainText(content)

    const response = await fetch(`${API_BASE_URL}/api/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: plainText }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate title')
    }

    const data: GenerateTitleResponse = await response.json()
    return data.title
  } catch (error) {
    console.error('Error generating title:', error)
    return 'Untitled'
  }
}

export const sendAgentMessage = async (request: AgentRequest): Promise<AgentResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error('Failed to get agent response')
    }

    const data: AgentResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error sending agent message:', error)
    throw error
  }
}

/**
 * Streaming agent message handler
 * Calls callbacks as chunks arrive progressively
 */
export const streamAgentMessage = async (
  request: AgentRequest,
  callbacks: {
    onChunk: (chunk: { id: string; oldText: string; newText: string; explanation: string }) => void
    onMessage: (message: string) => void
    onComplete: () => void
    onError: (error: string) => void
  }
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error('Failed to get streaming agent response')
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    // Parse SSE stream
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      // Decode chunk and add to buffer
      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE messages
      const lines = buffer.split('\n')

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // Remove 'data: ' prefix

          try {
            const parsed = JSON.parse(data)

            switch (parsed.type) {
              case 'chunk':
                callbacks.onChunk(parsed.chunk)
                break

              case 'message':
                callbacks.onMessage(parsed.message)
                break

              case 'done':
                callbacks.onComplete()
                return

              case 'error':
                callbacks.onError(parsed.error)
                return

              default:
                console.warn('Unknown SSE message type:', parsed.type)
            }
          } catch (error) {
            console.error('Failed to parse SSE data:', error, data)
          }
        }
      }
    }

  } catch (error) {
    console.error('Error streaming agent message:', error)
    callbacks.onError(error instanceof Error ? error.message : 'Unknown error')
  }
}
