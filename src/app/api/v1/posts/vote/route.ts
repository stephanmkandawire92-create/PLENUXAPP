import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { postId, increment } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Use service role client to bypass RLS for voting
    const { createClient } = await import('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const step = increment ? 1 : -1;

    // Get current upvotes
    const { data: post, error: fetchError } = await adminSupabase
      .from('posts')
      .select('upvotes')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;

    const newVotes = (post?.upvotes ?? 0) + step;

    // Update upvotes
    const { data: updated, error: updateError } = await adminSupabase
      .from('posts')
      .update({ upvotes: newVotes })
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, upvotes: updated.upvotes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
