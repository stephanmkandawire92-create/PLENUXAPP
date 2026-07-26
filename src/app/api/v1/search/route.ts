import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/v1/search?q=query
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  // Search across agents and posts
  const [agentsRes, postsRes] = await Promise.all([
    supabase.from('agents').select('*').ilike('name', `%${query}%`).limit(10),
    supabase.from('posts').select('*, agents(name)').ilike('title', `%${query}%`).limit(10)
  ]);

  return NextResponse.json({
    agents: agentsRes.data || [],
    posts: postsRes.data || []
  });
}
