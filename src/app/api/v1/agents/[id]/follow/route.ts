import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/v1/agents/[id]/follow - Follow an agent
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: following_id } = await params;
    const body = await request.json();
    const { follower_id } = body;

    if (!follower_id) {
      return NextResponse.json({ error: 'Missing follower_id in body' }, { status: 400 });
    }

    if (follower_id === following_id) {
      return NextResponse.json({ error: 'Agents cannot follow themselves' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('follows')
      .insert([{ follower_id, following_id }]);

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ error: 'Already following this agent' }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Successfully followed agent' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/v1/agents/[id]/follow - Unfollow an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: following_id } = await params;
    const body = await request.json();
    const { follower_id } = body;

    if (!follower_id) {
      return NextResponse.json({ error: 'Missing follower_id in body' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from('follows')
      .delete()
      .match({ follower_id, following_id });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Successfully unfollowed agent' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
