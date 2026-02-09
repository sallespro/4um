-- Create bundles table
CREATE TABLE IF NOT EXISTS public.bundles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  prompt text NOT NULL,
  target_session_ids jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

-- Policies for bundles
CREATE POLICY "Allow all on bundles" ON public.bundles
  FOR ALL TO anon USING (true) WITH CHECK (true);
