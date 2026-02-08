-- CloudPilot Schema Updates
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  title text DEFAULT 'New Chat',
  total_tokens integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='tokens') THEN
    ALTER TABLE public.messages ADD COLUMN tokens integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='session_id') THEN
    ALTER TABLE public.messages ADD COLUMN session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='messages' AND column_name='user_id') THEN
    ALTER TABLE public.messages ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.received_emails (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id text UNIQUE,
  from_address text NOT NULL,
  to_addresses text[] DEFAULT '{}',
  subject text,
  message_id text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for newly created tables
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- Add policies if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on sessions') THEN
    CREATE POLICY "Allow all on sessions" ON public.sessions FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on received_emails') THEN
    CREATE POLICY "Allow all on received_emails" ON public.received_emails FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
