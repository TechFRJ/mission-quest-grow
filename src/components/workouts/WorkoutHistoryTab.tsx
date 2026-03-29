import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Clock, Dumbbell, Layers } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutExercise {
  id: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  order: number | null;
  exercises: { name: string; primary_muscles: string[] | null } | null;
}

interface Workout {
  id: string;
  name: string | null;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  workout_exercises: WorkoutExercise[];
}

const MUSCLE_COLORS: Record<string, string> = {
  chest: 'border-l-red-500',
  back: 'border-l-blue-500',
  legs: 'border-l-emerald-500',
  shoulders: 'border-l-amber-500',
  biceps: 'border-l-violet-500',
  triceps: 'border-l-pink-500',
  abdominals: 'border-l-cyan-500',
  quadriceps: 'border-l-emerald-500',
  hamstrings: 'border-l-emerald-400',
  glutes: 'border-l-emerald-600',
  forearms: 'border-l-violet-400',
  traps: 'border-l-blue-400',
  lats: 'border-l-blue-600',
  'middle back': 'border-l-blue-500',
  'lower back': 'border-l-blue-300',
  calves: 'border-l-emerald-300',
  neck: 'border-l-gray-500',
};

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function getPrimaryMuscle(workout: Workout): string {
  const muscles: Record<string, number> = {};
  workout.workout_exercises.forEach((ex) => {
    const m = ex.exercises?.primary_muscles?.[0];
    if (m) muscles[m] = (muscles[m] || 0) + 1;
  });
  let top = '';
  let max = 0;
  for (const [k, v] of Object.entries(muscles)) {
    if (v > max) { top = k; max = v; }
  }
  return top;
}

export default function WorkoutHistoryTab() {
  const { user } = useAuth();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, date, duration_minutes, notes, workout_exercises(id, sets, reps, weight_kg, order, exercises(name, primary_muscles))')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as Workout[]) || [];
    },
    enabled: !!user,
  });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const workoutDates = new Set(workouts?.map((w) => w.date) || []);

  const weekWorkouts = workouts?.filter((w) => {
    const d = parseISO(w.date);
    return d >= weekStart && d <= addDays(weekStart, 6);
  }) || [];

  const weekTotalMin = weekWorkouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Weekly calendar strip */}
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const hasWorkout = workoutDates.has(dateStr);
            const isToday = isSameDay(day, now);

            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-[0.6rem] font-medium text-muted-foreground uppercase">
                  {DAY_LABELS[i]}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                <div className={`w-1.5 h-1.5 rounded-full ${hasWorkout ? 'bg-emerald-500' : 'bg-transparent'}`} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Week summary */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
        <Dumbbell className="w-3.5 h-3.5" />
        <span>
          Esta semana: <strong className="text-foreground">{weekWorkouts.length} treinos</strong> · <strong className="text-foreground">{weekTotalMin} min</strong> totais
        </span>
      </div>

      {/* Workout list or empty state */}
      {!workouts?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">Nenhum treino ainda</p>
          <p className="text-sm text-muted-foreground">Bora começar! 💪</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => {
            const muscle = getPrimaryMuscle(w);
            const borderClass = MUSCLE_COLORS[muscle] || 'border-l-muted-foreground';

            return (
              <Collapsible key={w.id}>
                <Card className={`border-l-4 ${borderClass}`}>
                  <CollapsibleTrigger className="w-full text-left">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">
                          {w.name || 'Treino sem nome'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {format(parseISO(w.date), "EEEE, dd MMM", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {w.duration_minutes && (
                            <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0 gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {w.duration_minutes}min
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0 gap-1">
                            <Layers className="w-2.5 h-2.5" />
                            {w.workout_exercises.length} exercícios
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                      {w.workout_exercises
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((ex) => (
                          <div key={ex.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground truncate">{ex.exercises?.name || 'Exercício'}</span>
                            <span className="text-muted-foreground text-xs shrink-0 ml-2">
                              {ex.sets}×{ex.reps} {ex.weight_kg ? `• ${ex.weight_kg}kg` : ''}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}
