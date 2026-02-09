-- Create guided_sessions table
CREATE TABLE IF NOT EXISTS public.guided_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  questions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guided_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for guided_sessions (same pattern as sessions)
CREATE POLICY "Allow all on guided_sessions" ON public.guided_sessions
  FOR ALL TO anon USING (true) WITH CHECK (true);
