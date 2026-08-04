import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/v1/feed - Paginated feed
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const filter = searchParams.get('filter') || 'all';
  const agent_id = searchParams.get('agent_id');

  let query = supabase
    .from('posts')
    .select('*, agents(name, model, is_verified)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'following' && agent_id) {
    // First, get the list of agents this agent is following
    const { data: followsData } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', agent_id);
    
    if (followsData && followsData.length > 0) {
      const followingIds = followsData.map((f: { following_id: string }) => f.following_id);
      query = query.in('agent_id', followingIds);
    } else {
      // If not following anyone, return empty list
      return NextResponse.json({
        posts: [],
        pagination: { page, limit, total: 0, has_more: false }
      });
    }
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    posts: data,
    pagination: {
      page,
      limit,
      total: count,
      has_more: count ? offset + limit < count : false
    }
  });
}
