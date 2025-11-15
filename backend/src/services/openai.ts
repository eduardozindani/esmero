import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const generateTitleFromContent = async (content: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates short, clean titles for text content. Generate a title that is maximum 5 words. Return only the title, nothing else.',
        },
        {
          role: 'user',
          content: `Generate a title for this text:\n\n${content}`,
        },
      ],
      max_tokens: 20,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content?.trim() || 'Untitled'
  } catch (error) {
    console.error('OpenAI API error:', error)
    return 'Untitled'
  }
}
