import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, CheckCircle, Loader2, GripVertical, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SelectedExercise {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
}

interface ExerciseResult {
  id: string;
  name: string;
  category: string | null;
  level: string | null;
  equipment: string | null;
  primary_muscles: string[] | null;
}

const MUSCLE_FILTERS = [
  { label: 'Peito', value: 'chest' },
  { label: 'Costas', value: 'lats' },
  { label: 'Pernas', value: 'quadriceps' },
  { label: 'Ombros', value: 'shoulders' },
  { label: 'Bíceps', value: 'biceps' },
  { label: 'Tríceps', value: 'triceps' },
];

export default function StartWorkoutTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workoutName, setWorkoutName] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  const doSearch = async (query: string, muscleFilter: string | null) => {
    if (query.length < 2 && !muscleFilter) {
      setResults([]);
      return;
    }
    setSearching(true);
    let q = supabase
      .from('exercises')
      .select('id, name, category, level, equipment, primary_muscles')
      .limit(12);

    if (muscleFilter) {
      q = q.contains('primary_muscles', [muscleFilter]);
    }
    if (query.length >= 2) {
      q = q.ilike('name', `%${query}%`);
    }

    const { data } = await q;
    setResults(data || []);
    setSearching(false);
  };

  const searchExercises = async (query: string) => {
    setSearch(query);
    doSearch(query, activeFilter);
  };

  const toggleFilter = (value: string) => {
    const next = activeFilter === value ? null : value;
    setActiveFilter(next);
    doSearch(search, next);
  };

  const addExercise = (ex: ExerciseResult) => {
    if (selected.find((s) => s.exercise_id === ex.id)) return;
    setSelected([...selected, { exercise_id: ex.id, name: ex.name, sets: 3, reps: 10, weight_kg: 0 }]);
    setSearch('');
    setResults([]);
    setActiveFilter(null);
  };

  const removeExercise = (id: string) => {
    setSelected(selected.filter((s) => s.exercise_id !== id));
  };

  const updateExercise = (id: string, field: keyof Pick<SelectedExercise, 'sets' | 'reps' | 'weight_kg'>, value: number) => {
    setSelected(selected.map((s) => (s.exercise_id === id ? { ...s, [field]: value } : s)));
  };

  const saveWorkout = async () => {
    if (!user) return;
    if (selected.length === 0) {
      toast.error('Adicione pelo menos um exercício');
      return;
    }
    setSaving(true);
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .insert({ user_id: user.id, name: workoutName || 'Treino sem nome', date: new Date().toISOString().split('T')[0] })
        .select('id')
        .single();
      if (error) throw error;

      const exercises = selected.map((s, i) => ({
        workout_id: workout.id,
        exercise_id: s.exercise_id,
        sets: s.sets,
        reps: s.reps,
        weight_kg: s.weight_kg,
        order: i,
      }));
      const { error: exError } = await supabase.from('workout_exercises').insert(exercises);
      if (exError) throw exError;

      toast.success('Treino salvo com sucesso! 💪');
      setWorkoutName('');
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['workout-week-stats'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  const levelBadge = (level: string | null) => {
    if (level === 'beginner') return { className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', label: 'Iniciante' };
    if (level === 'intermediate') return { className: 'bg-amber-500/15 text-amber-500 border-amber-500/30', label: 'Intermediário' };
    return { className: 'bg-red-500/15 text-red-500 border-red-500/30', label: 'Avançado' };
  };

  const equipmentIcon = (eq: string | null) => {
    if (!eq || eq === 'body only') return '🏋️';
    if (eq === 'dumbbell') return '🏋️‍♂️';
    if (eq === 'barbell') return '🪈';
    if (eq === 'cable') return '🔗';
    if (eq === 'machine') return '⚙️';
    return '🏋️';
  };

  const totalSets = selected.reduce((acc, ex) => acc + ex.sets, 0);
  const canSave = workoutName.trim().length > 0 && selected.length > 0;

  return (
    <div className="space-y-5 mt-5">
      {/* Workout Name */}
      <Input
        placeholder="Nome do treino (ex: Peito e Tríceps)"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        className="h-12 text-base font-semibold placeholder:font-semibold placeholder:text-muted-foreground/50 border-dashed"
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10 h-11"
          placeholder="Buscar exercício por nome..."
          value={search}
          onChange={(e) => searchExercises(e.target.value)}
        />
      </div>

      {/* Muscle Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {MUSCLE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => toggleFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              activeFilter === f.value
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/25'
                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card/50 p-2">
          {results.map((ex) => {
            const lvl = levelBadge(ex.level);
            const isAdded = selected.some(s => s.exercise_id === ex.id);
            return (
              <button
                key={ex.id}
                disabled={isAdded}
                onClick={() => addExercise(ex)}
                className={`w-full text-left rounded-lg p-3 transition-all border ${
                  isAdded
                    ? 'opacity-40 cursor-not-allowed border-border bg-muted'
                    : 'border-transparent hover:bg-accent hover:border-border cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{ex.name}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0 ${lvl.className}`}>
                        {lvl.label}
                      </Badge>
                      {ex.equipment && (
                        <span className="text-[0.65rem] text-muted-foreground flex items-center gap-0.5">
                          {equipmentIcon(ex.equipment)} {ex.equipment}
                        </span>
                      )}
                      {ex.primary_muscles?.slice(0, 3).map((m) => (
                        <Badge key={m} variant="secondary" className="text-[0.6rem] px-1.5 py-0 font-normal">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {!isAdded && (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {searching && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Buscando exercícios...</p>
        </div>
      )}

      {/* Selected Exercises */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Exercícios
            </h3>
            <span className="text-xs text-muted-foreground">
              {selected.length} exercício{selected.length > 1 ? 's' : ''} · {totalSets} séries
            </span>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-card p-2">
            {selected.map((ex) => (
              <div key={ex.exercise_id} className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0 cursor-grab" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate mb-1.5">{ex.name}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      <Input
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={(e) => updateExercise(ex.exercise_id, 'sets', Number(e.target.value))}
                        className="h-7 w-12 text-xs text-center px-1"
                      />
                      <span className="text-[0.6rem] text-muted-foreground">×</span>
                      <Input
                        type="number"
                        min={1}
                        value={ex.reps}
                        onChange={(e) => updateExercise(ex.exercise_id, 'reps', Number(e.target.value))}
                        className="h-7 w-12 text-xs text-center px-1"
                      />
                    </div>
                    <span className="text-[0.6rem] text-muted-foreground">@</span>
                    <div className="flex items-center gap-0.5">
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={ex.weight_kg}
                        onChange={(e) => updateExercise(ex.exercise_id, 'weight_kg', Number(e.target.value))}
                        className="h-7 w-14 text-xs text-center px-1"
                      />
                      <span className="text-[0.6rem] text-muted-foreground">kg</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeExercise(ex.exercise_id)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Button */}
      <Button
        onClick={saveWorkout}
        disabled={saving || !canSave}
        className={`w-full h-12 text-base font-bold rounded-xl transition-all ${
          canSave
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
            : ''
        }`}
        size="lg"
      >
        {saving ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <CheckCircle className="w-5 h-5 mr-2" />
        )}
        Concluir Treino
      </Button>
    </div>
  );
}
