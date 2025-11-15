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
