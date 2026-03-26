import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Calendar, Clock, Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutExercise {
  id: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  order: number | null;
  exercises: { name: string } | null;
}

interface Workout {
  id: string;
  name: string | null;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  workout_exercises: WorkoutExercise[];
}

export default function WorkoutHistoryTab() {
  const { user } = useAuth();

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, date, duration_minutes, notes, workout_exercises(id, sets, reps, weight_kg, order, exercises(name))')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data as unknown as Workout[]) || [];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (!workouts?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Dumbbell className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>
        <p className="text-xs text-muted-foreground mt-1">Inicie um treino na aba ao lado!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {workouts.map((w) => (
        <Collapsible key={w.id}>
          <Card>
            <CollapsibleTrigger className="w-full text-left">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{w.name || 'Treino sem nome'}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(w.date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    {w.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {w.duration_minutes}min
                      </span>
                    )}
                    <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">
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
      ))}
    </div>
  );
}
