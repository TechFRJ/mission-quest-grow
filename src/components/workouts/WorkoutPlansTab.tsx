import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Play,
  Trash2,
  Edit2,
  Search,
  Loader2,
  Dumbbell,
  ArrowLeft,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import ActiveWorkoutSession from './ActiveWorkoutSession';
import { translateExerciseName } from '@/lib/exerciseTranslations';
import ExerciseThumb from './ExerciseThumb';

const DAYS = [
  { label: 'Seg', fullLabel: 'Segunda', value: 1 },
  { label: 'Ter', fullLabel: 'Terça', value: 2 },
  { label: 'Qua', fullLabel: 'Quarta', value: 3 },
  { label: 'Qui', fullLabel: 'Quinta', value: 4 },
  { label: 'Sex', fullLabel: 'Sexta', value: 5 },
  { label: 'Sáb', fullLabel: 'Sábado', value: 6 },
  { label: 'Dom', fullLabel: 'Domingo', value: 7 },
];

const REST_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '1min', value: 60 },
  { label: '1m30', value: 90 },
  { label: '2min', value: 120 },
  { label: '3min', value: 180 },
];

function todayDayOfWeek(): number {
  const d = new Date().getDay(); // 0=Sun
  return d === 0 ? 7 : d;
}

interface SelectedExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
}

export default function WorkoutPlansTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDay, setSelectedDay] = useState(todayDayOfWeek());
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [sessionPlan, setSessionPlan] = useState<any | null>(null);

  // Form state
  const [planName, setPlanName] = useState('');
  const [restSeconds, setRestSeconds] = useState(60);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch plans for the selected day
  const { data: plans, isLoading } = useQuery({
    queryKey: ['workout-plans', user?.id, selectedDay],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from('workout_plans')
        .select(
          'id, name, day_of_week, rest_seconds, created_at, workout_plan_exercises(id, sets, reps, weight_kg, order, exercises(id, name, primary_muscles, equipment, level))'
        )
        .eq('user_id', user.id)
        .eq('day_of_week', selectedDay)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Also fetch all days overview (count per day)
  const { data: allPlansOverview } = useQuery({
    queryKey: ['workout-plans-overview', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await (supabase as any)
        .from('workout_plans')
        .select('day_of_week')
        .eq('user_id', user.id);
      if (error) return {};
      const counts: Record<number, number> = {};
      data?.forEach((p: any) => {
        counts[p.day_of_week] = (counts[p.day_of_week] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  const searchExercises = async (q: string) => {
    setSearch(q);
    if (!q || q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('exercises')
      .select('id, name, primary_muscles, equipment, level')
      .ilike('name', `%${q}%`)
      .limit(15);
    setSearchResults(data || []);
    setSearching(false);
  };

  const addExercise = (ex: any) => {
    if (selectedExercises.find((s) => s.exercise_id === ex.id)) return;
    setSelectedExercises([
      ...selectedExercises,
      { exercise_id: ex.id, name: ex.name, sets: 3, reps: 10, weight_kg: 0 },
    ]);
    setSearch('');
    setSearchResults([]);
  };

  const removeExercise = (id: string) =>
    setSelectedExercises(selectedExercises.filter((s) => s.exercise_id !== id));

  const updateExercise = (
    id: string,
    field: 'sets' | 'reps' | 'weight_kg',
    value: number
  ) =>
    setSelectedExercises(
      selectedExercises.map((s) =>
        s.exercise_id === id ? { ...s, [field]: value } : s
      )
    );

  const resetForm = () => {
    setPlanName('');
    setRestSeconds(60);
    setSelectedExercises([]);
    setSearch('');
    setSearchResults([]);
    setEditingPlanId(null);
  };

  const startCreate = () => {
    resetForm();
    setMode('create');
  };

  const startEdit = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setRestSeconds(plan.rest_seconds ?? 60);
    setSelectedExercises(
      [...(plan.workout_plan_exercises || [])]
        .sort((a: any, b: any) => a.order - b.order)
        .map((pe: any) => ({
          exercise_id: pe.exercises.id,
          name: pe.exercises.name,
          sets: pe.sets ?? 3,
          reps: pe.reps ?? 10,
          weight_kg: pe.weight_kg ?? 0,
        }))
    );
    setMode('edit');
  };

  const savePlan = async () => {
    if (!user || !planName.trim() || selectedExercises.length === 0) return;
    setSaving(true);
    try {
      if (editingPlanId) {
        await (supabase as any)
          .from('workout_plans')
          .update({ name: planName, rest_seconds: restSeconds })
          .eq('id', editingPlanId);
        await (supabase as any)
          .from('workout_plan_exercises')
          .delete()
          .eq('plan_id', editingPlanId);
        await (supabase as any)
          .from('workout_plan_exercises')
          .insert(
            selectedExercises.map((s, i) => ({
              plan_id: editingPlanId,
              exercise_id: s.exercise_id,
              sets: s.sets,
              reps: s.reps,
              weight_kg: s.weight_kg,
              order: i,
            }))
          );
        toast.success('Plano atualizado!');
      } else {
        const { data: plan, error } = await (supabase as any)
          .from('workout_plans')
          .insert({
            user_id: user.id,
            name: planName,
            day_of_week: selectedDay,
            rest_seconds: restSeconds,
          })
          .select('id')
          .single();
        if (error) throw error;
        await (supabase as any)
          .from('workout_plan_exercises')
          .insert(
            selectedExercises.map((s, i) => ({
              plan_id: plan.id,
              exercise_id: s.exercise_id,
              sets: s.sets,
              reps: s.reps,
              weight_kg: s.weight_kg,
              order: i,
            }))
          );
        toast.success('Plano criado! 💪');
      }
      queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
      queryClient.invalidateQueries({ queryKey: ['workout-plans-overview'] });
      resetForm();
      setMode('view');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar plano');
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (planId: string) => {
    await (supabase as any).from('workout_plans').delete().eq('id', planId);
    queryClient.invalidateQueries({ queryKey: ['workout-plans'] });
    queryClient.invalidateQueries({ queryKey: ['workout-plans-overview'] });
    toast.success('Plano removido');
  };

  // ─── ACTIVE WORKOUT SESSION ────────────────────────────────────
  if (sessionPlan) {
    return (
      <ActiveWorkoutSession
        plan={sessionPlan}
        onClose={() => setSessionPlan(null)}
      />
    );
  }

  // ─── CREATE / EDIT FORM ────────────────────────────────────────
  if (mode === 'create' || mode === 'edit') {
    const dayLabel = DAYS[selectedDay - 1]?.fullLabel ?? '';
    const canSave = planName.trim().length > 0 && selectedExercises.length > 0;

    return (
      <div className="space-y-4 mt-4">
        {/* Back nav */}
        <button
          onClick={() => {
            resetForm();
            setMode('view');
          }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div>
          <h2 className="text-base font-extrabold text-foreground">
            {mode === 'edit' ? 'Editar Plano' : `Treino de ${dayLabel}`}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {mode === 'edit' ? 'Ajuste os exercícios e configurações' : `Crie seu plano para ${dayLabel}`}
          </p>
        </div>

        {/* Plan name */}
        <Input
          placeholder="Nome do treino (ex: Peito e Tríceps)"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          className="h-12 text-base font-semibold placeholder:font-normal placeholder:text-muted-foreground/50 border-dashed"
        />

        {/* Rest time selector */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Tempo de descanso entre séries
          </div>
          <div className="flex flex-wrap gap-2">
            {REST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setRestSeconds(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  restSeconds === opt.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11"
            placeholder="Buscar exercício por nome..."
            value={search}
            onChange={(e) => searchExercises(e.target.value)}
          />
        </div>

        {searching && (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Buscando...</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border divide-y divide-border">
            {searchResults.map((ex) => {
              const isAdded = !!selectedExercises.find((s) => s.exercise_id === ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => addExercise(ex)}
                  disabled={isAdded}
                  className="w-full text-left px-3 py-2.5 hover:bg-accent transition-colors flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed bg-card"
                >
                  <ExerciseThumb name={ex.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{translateExerciseName(ex.name)}</p>
                    {ex.primary_muscles?.[0] && (
                      <p className="text-xs text-muted-foreground capitalize mt-0.5 truncate">
                        {ex.primary_muscles[0]}
                      </p>
                    )}
                  </div>
                  {!isAdded && <Plus className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                Exercícios ({selectedExercises.length})
              </h3>
            </div>

            {selectedExercises.map((ex, idx) => (
              <div
                key={ex.exercise_id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground w-4">{idx + 1}</span>
                    <ExerciseThumb name={ex.name} size={36} />
                    <span className="text-sm font-semibold text-foreground truncate">{translateExerciseName(ex.name)}</span>
                  </div>
                  <button
                    onClick={() => removeExercise(ex.exercise_id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border">
                  {(['sets', 'reps', 'weight_kg'] as const).map((field) => (
                    <div key={field} className="flex flex-col items-center py-3 px-2 gap-1.5">
                      <span className="text-[0.6rem] text-muted-foreground uppercase tracking-wider">
                        {field === 'sets' ? 'Séries' : field === 'reps' ? 'Reps' : 'Kg'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateExercise(
                              ex.exercise_id,
                              field,
                              Math.max(field === 'weight_kg' ? 0 : 1, ex[field] - (field === 'weight_kg' ? 2.5 : 1))
                            )
                          }
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground hover:bg-accent transition-colors"
                        >
                          −
                        </button>
                        <span className="text-sm font-extrabold text-foreground w-8 text-center tabular-nums">
                          {ex[field]}
                        </span>
                        <button
                          onClick={() =>
                            updateExercise(
                              ex.exercise_id,
                              field,
                              ex[field] + (field === 'weight_kg' ? 2.5 : 1)
                            )
                          }
                          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground hover:bg-accent transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={savePlan}
          disabled={!canSave || saving}
          className="w-full h-12 font-bold rounded-xl"
        >
          {saving
            ? 'Salvando...'
            : mode === 'edit'
            ? 'Salvar Alterações'
            : 'Criar Plano'}
        </Button>
      </div>
    );
  }

  // ─── VIEW MODE ────────────────────────────────────────────────
  return (
    <div className="space-y-4 mt-4">
      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => {
          const count = (allPlansOverview as any)?.[d.value] ?? 0;
          const isToday = todayDayOfWeek() === d.value;
          const isSelected = selectedDay === d.value;

          return (
            <button
              key={d.value}
              onClick={() => setSelectedDay(d.value)}
              className={`flex flex-col items-center py-2 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              <span className={`text-[0.65rem] font-bold ${isToday && !isSelected ? 'text-primary' : ''}`}>
                {d.label}
              </span>
              {count > 0 ? (
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isSelected ? 'bg-primary-foreground' : 'bg-emerald-500'
                  }`}
                />
              ) : (
                <div className="w-1.5 h-1.5 mt-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day label */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-foreground">
          {DAYS[selectedDay - 1]?.fullLabel}
          {todayDayOfWeek() === selectedDay && (
            <span className="ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              hoje
            </span>
          )}
        </h2>
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !plans?.length ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Dumbbell className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground mb-1">
            Sem treino para {DAYS[selectedDay - 1]?.fullLabel}
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            Crie um plano de treino para este dia
          </p>
          <Button onClick={startCreate} className="gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Criar Treino
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any) => {
            const sortedExercises = [...(plan.workout_plan_exercises ?? [])].sort(
              (a: any, b: any) => a.order - b.order
            );
            const restLabel =
              plan.rest_seconds < 60
                ? `${plan.rest_seconds}s`
                : plan.rest_seconds % 60 === 0
                ? `${plan.rest_seconds / 60}min`
                : `${Math.floor(plan.rest_seconds / 60)}m${plan.rest_seconds % 60}s`;

            return (
              <div
                key={plan.id}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Plan header */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-base text-foreground truncate">
                      {plan.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {sortedExercises.length} exercício{sortedExercises.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-muted-foreground/40">·</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {restLabel} descanso
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(plan)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exercise list */}
                <div className="px-4 pb-3 space-y-1">
                  {sortedExercises.slice(0, 4).map((pe: any, i: number) => (
                    <div
                      key={pe.id}
                      className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[0.6rem] font-bold text-muted-foreground/60 w-3">
                          {i + 1}
                        </span>
                        <ExerciseThumb name={pe.exercises?.name} size={28} rounded="rounded-md" />
                        <span className="text-sm text-foreground truncate">{translateExerciseName(pe.exercises?.name)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {pe.sets}×{pe.reps}
                        {pe.weight_kg > 0 ? ` · ${pe.weight_kg}kg` : ''}
                      </span>
                    </div>
                  ))}
                  {sortedExercises.length > 4 && (
                    <p className="text-xs text-muted-foreground pt-0.5">
                      +{sortedExercises.length - 4} exercícios
                    </p>
                  )}
                </div>

                {/* Start button */}
                <div className="px-4 pb-4">
                  <Button
                    onClick={() => setSessionPlan(plan)}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold h-11"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Iniciar Treino
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            onClick={startCreate}
            className="w-full gap-2 rounded-xl border-dashed"
          >
            <Plus className="w-4 h-4" />
            Adicionar outro treino para {DAYS[selectedDay - 1]?.label}
          </Button>
        </div>
      )}
    </div>
  );
}
