
-- Table to track attribute scores over time
CREATE TABLE public.attribute_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  attribute TEXT NOT NULL,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  source_mission_id UUID,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attribute_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attribute logs" ON public.attribute_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attribute logs" ON public.attribute_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attribute_logs_user_date ON public.attribute_logs (user_id, logged_at);
CREATE INDEX idx_attribute_logs_user_attr ON public.attribute_logs (user_id, attribute);

-- Add bio and goals to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS monthly_goal TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS github_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '';
