import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Timer, SkipForward, ChevronRight, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

interface PlanExercise {
  id: string;
  sets: number;
  reps: number;
  weight_kg: number;
  order: number;
  exercises: {
    id: string;
    name: string;
    primary_muscles: string[] | null;
    equipment: string | null;
  };
}

interface Plan {
  id: string;
  name: string;
  rest_seconds: number;
  workout_plan_exercises: PlanExercise[];
}

interface Props {
  plan: Plan;
  onClose: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function ActiveWorkoutSession({ plan, onClose }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const exercises = [...(plan.workout_plan_exercises || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const [exIdx, setExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<'working' | 'resting' | 'done'>('working');
  const [restLeft, setRestLeft] = useState(plan.rest_seconds);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  // Total workout stopwatch — ticks every second while not done
  useEffect(() => {
    if (phase === 'done') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Rest countdown
  useEffect(() => {
    if (phase !== 'resting') return;

    if (restLeft <= 0) {
      // Auto-advance after rest
      const ex = exercises[exIdx];
      if (currentSet < ex.sets) {
        setCurrentSet((s) => s + 1);
        setPhase('working');
      } else if (exIdx < exercises.length - 1) {
        setExIdx((i) => i + 1);
        setCurrentSet(1);
        setPhase('working');
      } else {
        setPhase('done');
      }
      return;
    }

    const t = setTimeout(() => setRestLeft((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restLeft, exIdx, currentSet, exercises]);

  const completeSet = () => {
    const ex = exercises[exIdx];
    const isLastSet = currentSet >= ex.sets;
    const isLastEx = exIdx >= exercises.length - 1;

    if (isLastSet && isLastEx) {
      setPhase('done');
    } else {
      setRestLeft(plan.rest_seconds);
      setPhase('resting');
    }
  };

  const skipRest = () => setRestLeft(0);

  const finishWorkout = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          name: plan.name,
          date: new Date().toISOString().split('T')[0],
          duration_minutes: Math.max(1, Math.round(elapsed / 60)),
        })
        .select('id')
        .single();
      if (error) throw error;

      const items = exercises.map((pe, i) => ({
        workout_id: workout.id,
        exercise_id: pe.exercises.id,
        sets: pe.sets,
        reps: pe.reps,
        weight_kg: pe.weight_kg,
        order: i,
      }));
      await supabase.from('workout_exercises').insert(items);

      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-week-stats'] });
      toast.success('Treino salvo! 🎉');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  const currentExercise = exercises[exIdx];
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets =
    exercises.slice(0, exIdx).reduce((a, e) => a + e.sets, 0) + (currentSet - 1);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  // ─── DONE SCREEN ────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Concluído</p>
            <h1 className="text-lg font-extrabold text-foreground">{plan.name}</h1>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="h-1 bg-emerald-500" />

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-28 h-28 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-foreground mb-2">Treino Concluído!</h2>
            <p className="text-muted-foreground text-sm">
              Duração total:{' '}
              <span className="text-foreground font-bold">{formatTime(elapsed)}</span>
            </p>
            <p className="text-muted-foreground text-sm mt-1">
              {exercises.length} exercícios · {totalSets} séries
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <p className="text-xl font-extrabold text-foreground">{exercises.length}</p>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-0.5">Exercícios</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <p className="text-xl font-extrabold text-foreground">{totalSets}</p>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-0.5">Séries</p>
            </div>
            <div className="rounded-xl bg-muted/60 p-3 text-center">
              <p className="text-xl font-extrabold text-foreground">{Math.max(1, Math.round(elapsed / 60))}</p>
              <p className="text-[0.6rem] text-muted-foreground uppercase mt-0.5">Minutos</p>
            </div>
          </div>
          <Button
            onClick={finishWorkout}
            disabled={saving}
            className="w-full max-w-xs h-14 text-base font-bold bg-emerald-600 hover:bg-emerald-700 rounded-2xl gap-2"
          >
            {saving ? 'Salvando...' : '🏆 Salvar Treino'}
          </Button>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    );
  }

  // ─── REST TIMER ──────────────────────────────────────────────────
  if (phase === 'resting') {
    const restPct = restLeft / plan.rest_seconds;
    const circumference = 2 * Math.PI * 45;
    const nextSet = currentSet < currentExercise.sets ? currentSet + 1 : 1;
    const nextExName =
      currentSet < currentExercise.sets
        ? currentExercise.exercises.name
        : exercises[exIdx + 1]?.exercises?.name ?? '';

    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Descansando</p>
            <h1 className="text-lg font-extrabold text-foreground">{plan.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-500/15 rounded-lg px-3 py-1.5">
              <Timer className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-500 tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
            Tempo de descanso
          </p>

          {/* Circular countdown */}
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - restPct)}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold tabular-nums text-foreground">
                {restLeft}
              </span>
              <span className="text-xs text-muted-foreground mt-1">segundos</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Próximo</p>
            <p className="text-base font-bold text-foreground">{nextExName}</p>
            <p className="text-sm text-muted-foreground">Série {nextSet}</p>
          </div>

          <Button variant="outline" onClick={skipRest} className="gap-2 rounded-xl px-6">
            <SkipForward className="w-4 h-4" />
            Pular Descanso
          </Button>
        </div>
      </div>
    );
  }

  // ─── WORKING SCREEN ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Em andamento</p>
          <h1 className="text-lg font-extrabold text-foreground truncate max-w-[180px]">
            {plan.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/15 rounded-lg px-3 py-1.5">
            <Timer className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-sm font-bold text-emerald-500 tabular-nums">
              {formatTime(elapsed)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
        {/* Exercise breadcrumb */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                  i < exIdx
                    ? 'bg-emerald-500/15 text-emerald-500'
                    : i === exIdx
                    ? 'bg-primary/15 text-primary font-bold'
                    : 'text-muted-foreground/50'
                }`}
              >
                {i < exIdx && <CheckCircle2 className="w-3 h-3" />}
                <span className="max-w-[72px] truncate">{ex.exercises.name.split(' ')[0]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Current exercise */}
        <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">
            Exercício {exIdx + 1} de {exercises.length}
          </p>
          <h2 className="text-2xl font-extrabold text-foreground leading-tight">
            {currentExercise.exercises.name}
          </h2>
          {currentExercise.exercises.primary_muscles?.[0] && (
            <p className="text-sm text-muted-foreground capitalize">
              {currentExercise.exercises.primary_muscles[0]}
            </p>
          )}
        </div>

        {/* Set tracker */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              Série {currentSet} de {currentExercise.sets}
            </span>
            <div className="flex gap-1.5">
              {Array.from({ length: currentExercise.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    i < currentSet - 1
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : i === currentSet - 1
                      ? 'border-primary text-primary bg-primary/10'
                      : 'border-border text-muted-foreground/40'
                  }`}
                >
                  {i < currentSet - 1 ? '✓' : i + 1}
                </div>
              ))}
            </div>
          </div>

          <div className={`grid gap-3 ${currentExercise.weight_kg > 0 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-4xl font-extrabold text-foreground">{currentExercise.reps}</p>
              <p className="text-xs text-muted-foreground mt-1">repetições</p>
            </div>
            {currentExercise.weight_kg > 0 && (
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <p className="text-4xl font-extrabold text-foreground">
                  {currentExercise.weight_kg}
                </p>
                <p className="text-xs text-muted-foreground mt-1">kg</p>
              </div>
            )}
          </div>
        </div>

        {/* Complete set CTA */}
        <Button
          onClick={completeSet}
          className="w-full h-16 text-lg font-extrabold bg-emerald-600 hover:bg-emerald-700 rounded-2xl gap-3 shadow-lg shadow-emerald-500/20"
        >
          <CheckCircle2 className="w-6 h-6" />
          Série Concluída
        </Button>

        {/* Upcoming */}
        {exIdx < exercises.length - 1 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              A seguir
            </p>
            {exercises.slice(exIdx + 1).map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-border/50 bg-card/40"
              >
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-3.5 h-3.5 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">{ex.exercises.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {ex.sets}×{ex.reps}
                  {ex.weight_kg > 0 ? ` · ${ex.weight_kg}kg` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
