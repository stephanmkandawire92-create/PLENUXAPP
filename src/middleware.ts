import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for backend operations
);

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 min
const MAX_REQUESTS = 100; // Increased for legitimate API usage

// In-memory store (use Redis in production)
const rateStore: Record<string, { count: number; reset: number }> = {};

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore[ip] ?? { count: 0, reset: now };
  
  if (entry.reset < now) {
    // Window expired - reset counter
    entry.count = 0;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
  }
  
  entry.count += 1;
  rateStore[ip] = entry;
  return entry.count > MAX_REQUESTS;
}

/**
 * Helper to hash a string with SHA-256 using Web Crypto API
 */
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
 * Middleware entry point
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip health check, static assets, and public routes
  if (
    pathname === '/api/health' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/sync') // Webhook endpoints
  ) {
    return NextResponse.next();
  }

  // Rate limiting (protect auth & registration endpoints)
  const ip = 
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  if (isRateLimited(ip)) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // API key authentication for all /api/v1/* routes
  if (pathname.startsWith('/api/v1')) {
    const authHeader = request.headers.get('Authorization');

    // Validate Bearer token format
    if (
      !authHeader?.startsWith('Bearer plnx_') ||
      authHeader.length <= 7 // "Bearer " + at least 1 char
    ) {
      return new Response('Unauthorized: Invalid token format', { 
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer' }
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    
    // Validate token is not empty or too short
    if (token.length < 10) {
      return new Response('Unauthorized: Token too short', { status: 401 });
    }

    // Hash the provided token with SHA-256 for comparison
    const providedHash = await sha256(token);

    // Fetch the stored salt, key_hash, and agent_id for the supplied hash
    const { data, error } = await supabase
      .from('api_keys')
      .select('salt, key_hash, agent_id')
      .eq('key_hash', providedHash)
      .single();

    if (!data || error) {
      // Log failed attempt for security monitoring
      console.warn(`Failed API key attempt from IP: ${ip}`);
      return new Response('Unauthorized: Invalid API key', { status: 401 });
    }

    // Re-hash using the stored salt to prevent timing attacks
    const reHashed = await hmacSha256(data.salt, token);

    // Constant-time comparison to prevent timing attacks
    const isValid = safeCompare(reHashed, data.key_hash);

    if (!isValid) {
      console.warn(`Failed API key attempt (hash mismatch) from IP: ${ip}`);
      return new Response('Unauthorized: Invalid API key', { status: 401 });
    }

    // Verify the caller owns this key (agent verification)
    const callerId = request.headers.get('x-user-id');
    
    if (callerId && data.agent_id !== callerId) {
      return new Response('Forbidden: Insufficient permissions', { 
        status: 403 
      });
    }

    // Update last_used_at for analytics/audit
    try {
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('key_hash', providedHash);
    } catch (updateError) {
      // Don't fail the request if update fails
      console.warn('Failed to update last_used_at:', updateError);
    }
  }

  // Continue to the requested route
  return NextResponse.next();
}

// Route-specific matcher – only protect API and auth routes
export const config = {
  matcher: [
    '/api/v1/:path*',
    '/api/auth/:path*',
    '/api/health',
    '/api/sync/:path*' // Webhook endpoints
  ],
};
