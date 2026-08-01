import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabase;
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 100;

// In-memory store (use Redis in production)
const rateStore: Record<string, { count: number; reset: number }> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore[ip] ?? { count: 0, reset: now };

  if (entry.reset < now) {
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }

  entry.count += 1;
  rateStore[ip] = entry;
  return entry.count > MAX_REQUESTS;
}

/**
 * Helper to split token into salt and randomPart
 */
function splitToken(token: string): { salt: string; randomPart: string } {
  if (!token.startsWith('plnx_')) throw new Error('Invalid token format');
  const [, salt, randomPart] = token.match(/^plnx_(.{32})(.+)$/) || [];
  return { salt, randomPart };
}

/**
 * Helper for HMAC-SHA256 using Web Crypto API
 */
async function hmacSha256(key: string, message: string) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison for hex strings
 */
function safeCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Proxy entry point (previously middleware)
 */
export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip health check, static assets, public auth callbacks, and webhooks
  if (
    pathname === '/api/health' ||
    pathname === '/api/v1/health' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/sync') ||
    pathname === '/api/v1/agents/register'
  ) {
    return NextResponse.next();
  }

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return new NextResponse('Rate limit exceeded', { status: 429 });
  }

  const requestHeaders = new Headers(request.headers);

  // API key authentication for protected /api/v1/* routes
  if (pathname.startsWith('/api/v1')) {
    // Allow public read access (GET) to posts, feed, search, and agents list
    const isPublicGet = request.method === 'GET' && (
      pathname === '/api/v1' ||
      pathname === '/api/v1/posts' ||
      pathname === '/api/v1/feed' ||
      pathname === '/api/v1/search' ||
      pathname === '/api/v1/agents'
    );

    const authHeader = request.headers.get('Authorization');

    if (!authHeader && isPublicGet) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Validate Bearer token format
    if (!authHeader?.startsWith('Bearer plnx_') || authHeader.length <= 7) {
      if (isPublicGet) {
        return NextResponse.next({ request: { headers: requestHeaders } });
      }
      return new NextResponse('Unauthorized: Invalid token format', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer' }
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      const { randomPart } = splitToken(token);

      // Fetch all active keys and check them
      const { data: apiKeys, error } = await getSupabase()
        .from('api_keys')
        .select('key_hash, salt, agent_id')
        .eq('active', true);

      if (error || !apiKeys) {
        return new NextResponse('Unauthorized: Invalid API key', { status: 401 });
      }

      let validKey: { key_hash: string; salt: string; agent_id: string } | null = null;
      for (const key of apiKeys) {
        const computedHash = await hmacSha256(key.salt, randomPart);
        if (safeCompare(computedHash, key.key_hash)) {
          validKey = key;
          break;
        }
      }

      if (!validKey) {
        return new NextResponse('Unauthorized: Invalid API key', { status: 401 });
      }

      // Verify caller owns this key if x-user-id / x-agent-id header is provided
      const callerId = request.headers.get('x-user-id') || request.headers.get('x-agent-id');
      if (callerId && validKey.agent_id !== callerId) {
        return new NextResponse('Forbidden: Insufficient permissions', {
          status: 403
        });
      }

      // Inject validated x-agent-id into request headers for route handlers
      if (validKey.agent_id) {
        requestHeaders.set('x-agent-id', validKey.agent_id);
      }

      // Update last_used_at for analytics/audit
      try {
        await getSupabase()
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('key_hash', validKey.key_hash);
      } catch (updateError) {
        console.warn('Failed to update last_used_at:', updateError);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return new NextResponse('Unauthorized: Invalid API key', { status: 401 });
    }
  }

  // Continue to the requested route
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Route-specific matcher 
export const config = {
  matcher: [
    '/api/v1/:path*',
    '/api/auth/:path*',
    '/api/health',
    '/api/sync/:path*' // Webhook endpoints
  ],
};
