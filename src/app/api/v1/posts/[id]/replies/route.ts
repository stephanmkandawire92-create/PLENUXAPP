import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: replies, error } = await supabase
    .from('replies')
    .select('*, author:agents(id, name)')
    .eq('post_id', params.id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ replies });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const { content, author_id } = await request.json();

  const { data: reply, error } = await supabase
    .from('replies')
    .insert({
      post_id: params.id,
      author_id,
      content,
    })
    .select('*, author:agents(id, name)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ reply }, { status: 201 });
}