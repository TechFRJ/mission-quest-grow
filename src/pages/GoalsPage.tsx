import { useState, useEffect } from 'react';
import { Crosshair, Plus, Lightbulb, RefreshCw } from 'lucide-react';
import { useGoals, GoalType, Goal } from '@/hooks/useGoals';
import { GoalTypeSelector } from '@/components/goals/GoalTypeSelector';
import { GoalConfigModal } from '@/components/goals/GoalConfigModal';
import { GoalCard } from '@/components/goals/GoalCards';
import { Button } from '@/components/ui/button';

export default function GoalsPage() {
  const hooks = useGoals();
  const { goals } = hooks;

  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [configType, setConfigType] = useState<GoalType | null>(null);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    setInsights(hooks.getInsights());
  }, [goals]);

  const handleTypeSelect = (type: GoalType) => {
    setShowTypeSelector(false);
    setConfigType(type);
  };

  const handleSave = (data: { name: string; color: string; config: any }) => {
    if (editingGoal) {
      hooks.updateGoal(editingGoal.id, data);
      setEditingGoal(null);
    } else if (configType) {
      hooks.addGoal({ type: configType, ...data });
    }
    setConfigType(null);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setConfigType(goal.type);
  };

  const sortedGoals = [...goals].sort(() => 0);
  const hasGoals = goals.length > 0;

  return (
    <div className="px-4 md:px-6 pt-6 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
          <Crosshair className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Metas</h1>
          <p className="text-xs text-muted-foreground">Defina e acompanhe seus objetivos</p>
        </div>
      </div>

      {!hasGoals ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-sm font-bold text-foreground mb-1">Nenhuma meta ainda</h2>
          <p className="text-xs text-muted-foreground mb-5">Crie sua primeira meta e comece a evoluir</p>
          <Button onClick={() => setShowTypeSelector(true)} className="gap-2 text-xs h-9">
            <Plus className="w-3.5 h-3.5" /> Nova Meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} hooks={hooks} onEdit={handleEdit} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[hsl(var(--coin))]" />
                  <h3 className="text-xs font-bold text-foreground">Insights</h3>
                </div>
                <button onClick={() => setInsights(hooks.getInsights())} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="text-[11px] text-foreground/80 leading-relaxed py-2 px-3 rounded-lg bg-muted/50 border border-border">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {hasGoals && (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="fixed bottom-20 right-6 sm:bottom-8 w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {showTypeSelector && <GoalTypeSelector onSelect={handleTypeSelect} onClose={() => setShowTypeSelector(false)} />}
      {configType && !editingGoal && <GoalConfigModal type={configType} onClose={() => setConfigType(null)} onSave={handleSave} />}
      {configType && editingGoal && (
        <GoalConfigModal
          type={configType}
          onClose={() => { setConfigType(null); setEditingGoal(null); }}
          onSave={handleSave}
          initial={{ name: editingGoal.name, color: editingGoal.color, config: editingGoal.config }}
        />
      )}
    </div>
  );
}
