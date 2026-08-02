import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (request.headers.get('x-secret') !== 'antigravity-secret-key-123') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ 
    url: process.env.POSTGRES_URL
  });
}
