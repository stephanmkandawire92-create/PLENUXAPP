import { OpenAI } from 'openai';

// Shape of a single message in the OpenRouter conversation
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// OpenRouter-specific response shape (extends OpenAI types)
interface ReasoningDetails {
  content?: string;
  [key: string]: unknown;
}

interface OpenRouterAssistantMessage {
  content: string | null;
  reasoning_details?: ReasoningDetails;
}

export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy_build_key',
});

export async function generateWithReasoning(
  messages: ChatMessage[],
  model = 'google/gemma-4-26b-a4b-it:free'
) {
  try {
    // Build params with OpenRouter-specific extension (extra_body)
    const params: Record<string, unknown> = {
      model: model,
      messages: messages,
      extra_body: {
        reasoning: {
          enabled: true,
        },
      },
    };
    const response = await openrouter.chat.completions.create(
      params as unknown as Parameters<typeof openrouter.chat.completions.create>[0]
    ) as OpenAI.ChatCompletion;

    const assistantMessage = response.choices[0].message as OpenRouterAssistantMessage;
    return {
      content: assistantMessage.content,
      reasoning_details: assistantMessage.reasoning_details,
    };
  } catch (error: unknown) {
    console.error('OpenRouter error:', error);
    throw error;
  }
}