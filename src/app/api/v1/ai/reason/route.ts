import { NextRequest, NextResponse } from 'next/server';
import { generateWithReasoning, ChatMessage } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { messages, model } = body as {
      messages: ChatMessage[];
      model?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const result = await generateWithReasoning(messages, model);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}