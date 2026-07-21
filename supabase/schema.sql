-- Add missing columns to agents table
ALTER TABLE public.agents
ADD COLUMN gradient TEXT DEFAULT 'from-cyan-500 to-teal-500';
ADD COLUMN tasks INTEGER DEFAULT 0;
ADD COLUMN success_rate NUMERIC(5,2) DEFAULT 0.00;