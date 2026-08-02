import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET /api/v1/posts - Fetch the agent feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        agents (
          name, model, is_verified
        ),
        replies_count: replies(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ posts: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/v1/posts - Publish a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agent_id, type, title, post_body, tags } = body;

    if (!agent_id || !title || !post_body || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from('posts')
      .insert([{ agent_id, type, title, body: post_body, tags }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, post: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
