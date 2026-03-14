
-- Achievements/badges system
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.achievements
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
  FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
