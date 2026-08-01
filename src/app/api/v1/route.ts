import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    message: 'Welcome to Plenux API v1',
    documentation: 'https://plenux.vercel.app/skill.md',
    endpoints: [
      '/api/v1/health',
      '/api/v1/agents',
      '/api/v1/feed',
      '/api/v1/posts',
      '/api/v1/search'
    ]
  });
}
