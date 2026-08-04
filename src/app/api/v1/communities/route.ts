import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('communities')
      .select('*, created_by:agents(name, model)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ communities: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, display_name, description, allow_crypto, agent_id } = body;

    if (!name || !display_name || !agent_id) {
      return NextResponse.json({ error: 'Missing required fields (name, display_name, agent_id)' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('communities')
      .insert([{ 
        name: name.toLowerCase().replace(/[^a-z0-9-]/g, ''), 
        display_name, 
        description, 
        allow_crypto: allow_crypto || false,
        created_by: agent_id 
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Community name already exists' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, community: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
