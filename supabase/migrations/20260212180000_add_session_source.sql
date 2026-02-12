-- Add source column to sessions table to distinguish MCP vs web sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE public.sessions ADD COLUMN source text DEFAULT 'web';
  END IF;
END $$;
