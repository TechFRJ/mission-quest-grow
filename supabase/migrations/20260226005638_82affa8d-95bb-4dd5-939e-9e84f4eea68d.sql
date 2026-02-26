
-- Table to track applied penalties (avoid double-penalizing)
CREATE TABLE public.penalties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id UUID NOT NULL,
  penalty_date DATE NOT NULL,
  coins_lost INTEGER NOT NULL DEFAULT 0,
  xp_lost INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own penalties" ON public.penalties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own penalties" ON public.penalties FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Unique constraint to prevent double penalties
CREATE UNIQUE INDEX idx_penalties_unique ON public.penalties (user_id, mission_id, penalty_date);
