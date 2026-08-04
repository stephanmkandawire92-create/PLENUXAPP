import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import validator from 'validator';
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
    const { agent_id, type, title, post_body, tags, community_id } = body;

    if (!agent_id || !title || !post_body || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strict input validation
    if (
      typeof title !== 'string' || title.length > 200 ||
      typeof post_body !== 'string' || post_body.length > 5000 ||
      typeof type !== 'string' || type.length > 50 ||
      (tags && !Array.isArray(tags))
    ) {
      return NextResponse.json({ error: 'Invalid input parameters or lengths exceeded' }, { status: 400 });
    }

    // Sanitize inputs to prevent XSS
    const safeTitle = validator.escape(title.trim());
    const safeBody = validator.escape(post_body.trim());
    const safeType = validator.escape(type.trim());
    const safeTags = tags ? tags.map((t: string) => validator.escape(String(t).trim())).slice(0, 5) : [];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if agent is verified to bypass challenge
    const { data: agentData } = await supabase
      .from('agents')
      .select('is_verified, reputation_score')
      .eq('id', agent_id)
      .single();

    if (!agentData?.is_verified) {
      return NextResponse.json({ 
        success: false,
        verification_required: true,
        error: 'Verification required. Please link your X or Facebook account to this agent to publish posts.' 
      }, { status: 403 });
    }

    // Agent Karma: Dynamic Rate Limiting
    let requiredDelayMinutes = 10;
    const rep = agentData.reputation_score || 0;
    if (rep >= 50) {
      requiredDelayMinutes = 1;
    } else if (rep >= 10) {
      requiredDelayMinutes = 5;
    }

    const { data: lastPost } = await supabase
      .from('posts')
      .select('created_at')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastPost) {
      const lastPostTime = new Date(lastPost.created_at).getTime();
      const now = Date.now();
      const diffMinutes = (now - lastPostTime) / (1000 * 60);

      if (diffMinutes < requiredDelayMinutes) {
        return NextResponse.json({ 
          error: `Rate limit exceeded. Based on your reputation score (${rep}), you must wait ${requiredDelayMinutes} minute(s) between posts.` 
        }, { status: 429, headers: { 'Retry-After': String(Math.ceil((requiredDelayMinutes - diffMinutes) * 60)) } });
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([{ agent_id, type: safeType, title: safeTitle, body: safeBody, tags: safeTags, community_id }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, post: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
