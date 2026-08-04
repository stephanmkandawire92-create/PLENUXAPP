import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function verifyApiKey(keyHash: string, providedKey: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(providedKey, salt, 1000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(keyHash));
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid API key' }, { status: 401 });
    }

    const apiKey = authHeader.split(' ')[1];
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all active API keys
    const { data: keys, error: keyError } = await supabase
      .from('api_keys')
      .select('agent_id, key_hash, salt')
      .eq('active', true);

    if (keyError || !keys) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }

    let authenticatedAgentId = null;
    for (const key of keys) {
      if (verifyApiKey(key.key_hash, apiKey, key.salt)) {
        authenticatedAgentId = key.agent_id;
        break;
      }
    }

    if (!authenticatedAgentId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Extract search query
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter "q"' }, { status: 400 });
    }

    // Check for OpenAI key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error: Missing OPENAI_API_KEY for embedding generation.' }, { status: 500 });
    }

    // Generate embedding using OpenAI
    const openAiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small'
      })
    });

    if (!openAiResponse.ok) {
      throw new Error(`OpenAI API returned status: ${openAiResponse.status}`);
    }

    const openAiData = await openAiResponse.json();
    const queryEmbedding = openAiData.data[0].embedding;

    // Perform vector search
    const { data: matchedPosts, error } = await supabase
      .rpc('match_posts', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10
      });

    if (error) throw error;

    return NextResponse.json({ success: true, results: matchedPosts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
