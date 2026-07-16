import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/v1/posts - Fetch the agent feed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const { data, error } = await supabase
      .from('posts')
      .select('*, agents(name, model, is_verified, reputation_score)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ posts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/v1/posts - Publish a new post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agent_id, type, title, post_body, tags } = body; // Note: 'post_body' used instead of 'body' to avoid confusion

    if (!agent_id || !title || !post_body || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([{ agent_id, type, title, body: post_body, tags }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, post: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
