"use server";

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import validator from 'validator';

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rate-limit memory store (same as middleware – duplicate for simplicity)
const store: Record<string, { count: number; reset: number }> = {};
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = store[ip] || { count: 0, reset: now + WINDOW_MS };

  if (rec.reset < now) {
    rec.count = 0;
    rec.reset = now + WINDOW_MS;
  }

  rec.count += 1;
  store[ip] = rec;
  return rec.count <= MAX_ATTEMPTS;
}

// Constants for key generation
const SALT_LENGTH = 16;
const KEY_LENGTH = 24; // bytes -> ~48 chars hex

export async function POST(request: NextRequest) {
  const clientIP = request.headers.get('x-forwarded-for')?.split(',').shift()?.trim() ?? 'unknown';

  // Rate limit by IP
  if (!rateLimit(clientIP)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  // Parse body safely
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, password, agentType } = body as {
    name: unknown;
    email: unknown;
    password: unknown;
    agentType: unknown;
  };

  // Input validation with sanitization
  const errors: string[] = [];
  let sanitizedName = '';
  let sanitizedEmail = '';

  // Sanitize and validate name
  if (!name || typeof name !== 'string') {
    errors.push('Name is required');
  } else {
    sanitizedName = validator.escape(name.trim());
    if (!/^[A-Za-z0-9\s]{2,100}$/.test(sanitizedName)) {
      errors.push('Name must contain only letters, numbers, or spaces, and be 2‑100 characters');
    }
  }

  // Sanitize and validate email
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const normalized = validator.normalizeEmail(email);
    if (!normalized || !validator.isEmail(normalized)) {
      errors.push('Invalid email address');
    } else {
      sanitizedEmail = normalized as string;
    }
  }

  // Validate password (minimum strength)
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  // Validate agent type if present
  const allowedTypes = ['human', 'ai', 'both'];
  const agentTypeNorm = typeof agentType === 'string' ? agentType.toLowerCase() : 'human';
  if (!allowedTypes.includes(agentTypeNorm)) {
    errors.push('Invalid agent type');
  }

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  // Check if email already exists in Supabase Auth
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const exists = existingUsers?.users?.some(u => u.email === email);

  if (exists) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
  }

  // Generate secure API key
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const randomPart = crypto.randomBytes(KEY_LENGTH).toString('hex');
  const rawApiKey = `plnx_${salt}${randomPart}`;

  // Hash the key for storage (HMAC‑SHA256 with salt)
  const keyHash = crypto
    .createHmac('sha256', salt)
    .update(randomPart)
    .digest('hex');

  // Try to create the Supabase Auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email as string,
    password: password as string,
    email_confirm: true, // auto‑confirm for simplicity
    user_metadata: {
      name: (name as string).trim(),
      agent_type: agentTypeNorm,
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 500 });
  }

  // Insert profile (link to auth.users id)
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{
      id: authData.user.id,
      full_name: (name as string).trim(),
      metadata: JSON.stringify({ agent_type: agentTypeNorm, email: sanitizedEmail }),
    }]);

  if (profileError) {
    // If profile fails, try to delete the auth user so we don't leak orphaned accounts
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
  }

  // Create the agents entry
  const { data: agentData, error: agentError } = await supabase
    .from('agents')
    .insert([{
      profile_id: authData.user.id,
      name: (name as string).trim(),
      type: agentTypeNorm === 'both' ? null : agentTypeNorm,
    }]);

  if (agentError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from('profiles').delete().eq('id', authData.user.id);
    return NextResponse.json({ error: 'Failed to create agent record' }, { status: 500 });
  }

  // Insert into api_keys (with salt + key_hash + active flag)
  const { error: keyError } = await supabase
    .from('api_keys')
    .insert([{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      agent_id: (agentData as any)?.[0]?.id,
      salt,
      key_hash: keyHash,
      label: `${(name as string).trim()}'s API Key`,
      active: true,
    }]);

  if (keyError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from('profiles').delete().eq('id', authData.user.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from('agents').delete().eq('id', (agentData as any)?.[0]?.id);
    return NextResponse.json({ error: 'Failed to create API key record' }, { status: 500 });
  }

  // Respond only with the raw key (front‑end must store securely!)
  return NextResponse.json(
    {
      success: true,
      message: 'Agent registered successfully',
      api_key: rawApiKey,
    },
    {
      status: 201,
      headers: {
        // Enable CORS for browser clients (adjust origin as needed)
        'Access-Control-Allow-Origin': request.headers.get('origin') ?? '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}