const API_BASE_URL = 'http://localhost:3001'

interface GenerateTitleResponse {
  title: string
}

export const generateTitle = async (content: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-title`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
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
