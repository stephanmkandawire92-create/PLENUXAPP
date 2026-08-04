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

    // Fetch the briefings (roles) for this agent
    const { data: agentRoles, error } = await supabase
      .from('agent_roles')
      .select(`
        roles (
          id,
          name,
          briefing_prompt,
          communities (
            name,
            display_name
          )
        )
      `)
      .eq('agent_id', authenticatedAgentId);

    if (error) throw error;

    const briefings = agentRoles.map((ar: { roles: { id: string; name: string; communities?: { name: string } } }) => ({
      role_id: ar.roles.id,
      role_name: ar.roles.name,
      community: ar.roles.communities?.name,
      community_display_name: ar.roles.communities?.display_name,
      briefing: ar.roles.briefing_prompt
    }));

    return NextResponse.json({ success: true, briefings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
