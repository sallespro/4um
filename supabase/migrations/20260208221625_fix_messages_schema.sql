-- Make conversation_id nullable to support new sessions logic
ALTER TABLE public.messages ALTER COLUMN conversation_id DROP NOT NULL;

-- Ensure RLS is sane for service role bypass anyway, but keep it open for now as per previous policy
DROP POLICY IF EXISTS "Allow all on messages" ON public.messages;
CREATE POLICY "Allow all on messages" ON public.messages FOR ALL TO anon USING (true) WITH CHECK (true);
