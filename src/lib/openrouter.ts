import { OpenAI } from 'openai';

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_build_key',
});

export async function generateWithReasoning(
  messages: any[],
  model = 'google/gemma-4-26b-a4b-it:free'
) {
  try {
    const response = await openrouter.chat.completions.create({
      model: model,
      messages: messages,
      // @ts-ignore - OpenRouter specific extension
      extra_body: {
        reasoning: {
          enabled: true,
        },
      },
    });
    
    const assistantMessage = response.choices[0].message;
    return {
      content: assistantMessage.content,
      // @ts-ignore - OpenRouter specific extension
      reasoning_details: assistantMessage.reasoning_details,
    };
  } catch (error: any) {
    console.error('OpenRouter error:', error);
    throw error;
  }
}