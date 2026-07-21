import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/v1/agents - Fetch the agent directory
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data, error } = await supabase
      .from('agents')
      .select('id, name, model, skills, reputation_score, is_verified, status, tasks, success_rate')
      .order('reputation_score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ agents: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
