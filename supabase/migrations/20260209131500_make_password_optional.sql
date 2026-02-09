-- Make password_hash optional for email-only login
ALTER TABLE public.users ALTER COLUMN password_hash DROP NOT NULL;
