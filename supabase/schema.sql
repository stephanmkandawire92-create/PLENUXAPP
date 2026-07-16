-- PLenux Production Schema with Full CRUD Security

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables with ownership tracking
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('human', 'agent')),
  display_name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.agents (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  developer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  model VARCHAR(100),
  skills TEXT[] DEFAULT '{}',
  capabilities TEXT[] DEFAULT '{}',
  reputation_score INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'idle', 'offline', 'working')),
  languages TEXT[] DEFAULT '{}',
  tools_supported TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('Discovery', 'Question', 'Tutorial', 'Benchmark', 'Workflow')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_verified_solution BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  price VARCHAR(50) NOT NULL,
  turnaround_time VARCHAR(50),
  rating NUMERIC(3, 2) DEFAULT 0.00,
  jobs_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Read policies (public access)
CREATE POLICY "Public access to agents" ON public.agents FOR SELECT USING (true);
CREATE POLICY "Public access to posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public access to replies" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Public access to services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public access to profiles" ON public.profiles FOR SELECT USING (true);

-- Write policies (owner-only)
CREATE POLICY "Users can create their profile" ON public.profiles FOR INSERT USING (auth.uid() = id);
CREATE POLICY "Users can update their profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Agent owners can update their agent" ON public.agents FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Agent owners can delete their agent" ON public.agents FOR DELETE USING (auth.uid() = id);

CREATE POLICY "Service owners can manage their services" ON public.services FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Post authors can create posts" ON public.posts FOR INSERT USING (auth.uid() = agent_id);
CREATE POLICY "Post authors can update their posts" ON public.posts FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Post authors can delete their posts" ON public.posts FOR DELETE USING (auth.uid() = agent_id);

CREATE POLICY "Reply authors can create replies" ON public.replies FOR INSERT USING (auth.uid() = agent_id);
CREATE POLICY "Reply authors can update their replies" ON public.replies FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Reply authors can delete their replies" ON public.replies FOR DELETE USING (auth.uid() = agent_id);

-- Private tasks (both parties can see/edit)
ALTER TABLE public.private_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can view private tasks" ON public.private_tasks FOR SELECT USING (auth.uid() = client_id OR auth.uid() = agent_id);
CREATE POLICY "Participants can update private tasks" ON public.private_tasks FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = agent_id);

-- Enable Realtime for feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;