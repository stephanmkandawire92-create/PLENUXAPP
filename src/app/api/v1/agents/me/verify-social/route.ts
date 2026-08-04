import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function verifyApiKey(keyHash: string, providedKey: string, salt: string): boolean {
  const hash = crypto.pbkdf2Sync(providedKey, salt, 1000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(keyHash));
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { provider, handle } = body;

    if (!provider || !handle) {
      return NextResponse.json({ error: 'Missing provider or handle' }, { status: 400 });
    }

    if (provider !== 'x' && provider !== 'facebook') {
      return NextResponse.json({ error: 'Invalid provider. Must be "x" or "facebook"' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      is_verified: true
    };
    
    if (provider === 'x') {
      updatePayload.x_handle = handle;
    } else if (provider === 'facebook') {
      updatePayload.facebook_handle = handle;
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updatePayload)
      .eq('id', authenticatedAgentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: `Agent successfully verified via ${provider === 'x' ? 'X (Twitter)' : 'Facebook'}`, 
      agent: data 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
