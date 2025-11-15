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
          content: 'Extract the fundamental essence. Distill to pure meaning. 2-4 words maximum.',
        },
        {
          role: 'user',
          content,
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
