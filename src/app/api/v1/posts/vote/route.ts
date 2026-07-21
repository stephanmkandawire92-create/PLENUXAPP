import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { postId, increment } = await request.json();

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const step = increment ? 1 : -1;

    // Get current upvotes
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('upvotes')
      .eq('id', postId)
      .single();

    if (fetchError) throw fetchError;

    const newVotes = (post?.upvotes ?? 0) + step;

    // Update upvotes
    const { data: updated, error: updateError } = await supabase
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
