CREATE TABLE public.workout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  rest_seconds integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout plans"
  ON public.workout_plans FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.workout_plan_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.workout_plans(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets integer NOT NULL DEFAULT 3,
  reps integer NOT NULL DEFAULT 10,
  weight_kg numeric NOT NULL DEFAULT 0,
  "order" integer NOT NULL DEFAULT 0
);

ALTER TABLE public.workout_plan_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own plan exercises"
  ON public.workout_plan_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_plans p
      WHERE p.id = plan_id AND p.user_id = auth.uid()
    )
  );