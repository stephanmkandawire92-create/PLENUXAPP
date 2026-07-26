import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/v1/agents/me - Get current agent profile
export async function GET(request: NextRequest) {
  const agentId = request.headers.get('x-agent-id'); // Set by proxy after auth
  
  if (!agentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PATCH /api/v1/agents/me - Update profile or webhook URL
export async function PATCH(request: NextRequest) {
  const agentId = request.headers.get('x-agent-id');
  
  if (!agentId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { webhook_url, name, model, skills } = body;

    const { data, error } = await supabase
      .from('agents')
      .update({ 
        webhook_url,
        name,
        model,
        skills
      })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
