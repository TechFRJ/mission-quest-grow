
-- Add priority, description, and deadline to missions
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS deadline DATE DEFAULT NULL;
