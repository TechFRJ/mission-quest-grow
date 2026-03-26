import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, CheckCircle, Loader2 } from 'lucide-react';
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

export default function StartWorkoutTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [workoutName, setWorkoutName] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SelectedExercise[]>([]);
  const [saving, setSaving] = useState(false);

  const searchExercises = async (query: string) => {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from('exercises')
      .select('id, name, category, level, equipment, primary_muscles')
      .or(`name.ilike.%${query}%,primary_muscles.cs.{${query.toLowerCase()}}`)
      .limit(10);
    setResults(data || []);
    setSearching(false);
  };

  const addExercise = (ex: ExerciseResult) => {
    if (selected.find((s) => s.exercise_id === ex.id)) return;
    setSelected([...selected, { exercise_id: ex.id, name: ex.name, sets: 3, reps: 10, weight_kg: 0 }]);
    setSearch('');
    setResults([]);
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

      toast.success('Treino salvo com sucesso!');
      setWorkoutName('');
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  const levelColor = (level: string | null) => {
    if (level === 'beginner') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (level === 'intermediate') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-red-500/15 text-red-400 border-red-500/30';
  };

  return (
    <div className="space-y-4 mt-4">
      <Input
        placeholder="Nome do treino (ex: Peito e Tríceps)"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Buscar exercício por nome ou músculo..."
          value={search}
          onChange={(e) => searchExercises(e.target.value)}
        />
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((ex) => (
            <Card
              key={ex.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => addExercise(ex)}
            >
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{ex.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ex.level && (
                      <Badge variant="outline" className={`text-[0.6rem] px-1.5 py-0 ${levelColor(ex.level)}`}>
                        {ex.level}
                      </Badge>
                    )}
                    {ex.equipment && (
                      <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">
                        {ex.equipment}
                      </Badge>
                    )}
                    {ex.primary_muscles?.slice(0, 2).map((m) => (
                      <Badge key={m} variant="outline" className="text-[0.6rem] px-1.5 py-0">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searching && <p className="text-xs text-muted-foreground text-center">Buscando...</p>}

      {/* Selected Exercises */}
      {selected.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Exercícios ({selected.length})</h3>
          {selected.map((ex) => (
            <Card key={ex.exercise_id}>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                  <button onClick={() => removeExercise(ex.exercise_id)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[0.65rem] text-muted-foreground">Séries</label>
                    <Input
                      type="number"
                      min={1}
                      value={ex.sets}
                      onChange={(e) => updateExercise(ex.exercise_id, 'sets', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-muted-foreground">Reps</label>
                    <Input
                      type="number"
                      min={1}
                      value={ex.reps}
                      onChange={(e) => updateExercise(ex.exercise_id, 'reps', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[0.65rem] text-muted-foreground">Peso (kg)</label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      value={ex.weight_kg}
                      onChange={(e) => updateExercise(ex.exercise_id, 'weight_kg', Number(e.target.value))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Save Button */}
      <Button onClick={saveWorkout} disabled={saving || selected.length === 0} className="w-full" size="lg">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
        Concluir Treino
      </Button>
    </div>
  );
}
