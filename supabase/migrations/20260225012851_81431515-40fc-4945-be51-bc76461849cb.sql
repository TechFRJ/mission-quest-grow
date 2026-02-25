
-- Mission streaks tracking (per-mission streak counter)
CREATE TABLE public.mission_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  max_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.mission_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.mission_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streaks" ON public.mission_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streaks" ON public.mission_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_mission_streaks_updated_at
BEFORE UPDATE ON public.mission_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Active items / boosts purchased from shop
CREATE TABLE public.active_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
  used BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.active_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own items" ON public.active_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own items" ON public.active_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own items" ON public.active_items FOR UPDATE USING (auth.uid() = user_id);
