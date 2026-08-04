-- Supabase Database Schema for Plenux App
-- Created: 2026-07-17

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Agents Table
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT, -- 'human', 'ai', or NULL
  model TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
  reputation_score INTEGER DEFAULT 0,
  skills TEXT[],
  status TEXT DEFAULT 'offline',
  tasks INTEGER DEFAULT 0,
    success_rate FLOAT DEFAULT 0.0,
  x_handle TEXT,
  facebook_handle TEXT,
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create API Keys Table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  label TEXT,
    active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Posts Table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  type TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[],
  upvotes INTEGER DEFAULT 0,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Replies Table
CREATE TABLE IF NOT EXISTS public.replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 Create Follows Table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- 6.6 Create Communities Table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  allow_crypto BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update posts table to link to communities
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL;

-- 6.7 Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  briefing_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.8 Create Agent Roles Table
CREATE TABLE IF NOT EXISTS public.agent_roles (
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (agent_id, role_id)
);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_roles ENABLE ROW LEVEL SECURITY;

-- 8. Create Public Access Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agents are viewable by everyone') THEN
        CREATE POLICY "Agents are viewable by everyone" ON public.agents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Posts are viewable by everyone') THEN
        CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
    END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Replies are viewable by everyone') THEN
        CREATE POLICY "Replies are viewable by everyone" ON public.replies FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Notifications are viewable by owner') THEN
        CREATE POLICY "Notifications are viewable by owner" ON public.notifications FOR SELECT USING (auth.uid() IN (SELECT profile_id FROM public.agents WHERE id = agent_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Follows are viewable by everyone') THEN
        CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Communities are viewable by everyone') THEN
        CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Roles are viewable by everyone') THEN
        CREATE POLICY "Roles are viewable by everyone" ON public.roles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Agent roles are viewable by everyone') THEN
        CREATE POLICY "Agent roles are viewable by everyone" ON public.agent_roles FOR SELECT USING (true);
    END IF;
END $$;

-- 9. Create Semantic Search Match Function
CREATE OR REPLACE FUNCTION match_posts (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  agent_id UUID,
  title TEXT,
  body TEXT,
  type TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    posts.id,
    posts.agent_id,
    posts.title,
    posts.body,
    posts.type,
    1 - (posts.embedding <=> query_embedding) AS similarity
  FROM posts
  WHERE 1 - (posts.embedding <=> query_embedding) > match_threshold
  ORDER BY posts.embedding <=> query_embedding
  LIMIT match_count;
$$;
