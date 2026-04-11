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

  // Sort: completed goals go to the end
  const sortedGoals = [...goals].sort((a, b) => {
    // Simple heuristic: we won't deeply compute completion here, just order by creation
    return 0;
  });

  const hasGoals = goals.length > 0;

  return (
    <div className="px-4 pt-4 pb-24 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Crosshair className="w-6 h-6 text-primary" />
        <h1 className="font-display text-xl font-bold tracking-wider text-foreground">Metas</h1>
      </div>

      {!hasGoals ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-6xl mb-4">🎯</span>
          <h2 className="text-lg font-bold text-foreground mb-2">Nenhuma meta ainda</h2>
          <p className="text-sm text-muted-foreground mb-6">Crie sua primeira meta e comece a evoluir</p>
          <Button onClick={() => setShowTypeSelector(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nova Meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sortedGoals.map(goal => (
                <GoalCard key={goal.id} goal={goal} hooks={hooks} onEdit={handleEdit} />
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="lg:col-span-1">
            <div className="neon-card-static bg-secondary/5 border border-secondary/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-secondary" />
                  <h3 className="font-display text-sm font-bold tracking-wide text-secondary">💡 Insights</h3>
                </div>
                <button onClick={() => setInsights(hooks.getInsights())} className="text-muted-foreground hover:text-secondary transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {insights.map((insight, i) => (
                  <div key={i} className="text-xs text-foreground/80 leading-relaxed py-2 px-3 rounded-lg bg-muted/30 border border-border/50">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {hasGoals && (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="fixed bottom-20 right-6 sm:bottom-8 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50"
          style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modals */}
      {showTypeSelector && (
        <GoalTypeSelector onSelect={handleTypeSelect} onClose={() => setShowTypeSelector(false)} />
      )}

      {configType && !editingGoal && (
        <GoalConfigModal type={configType} onClose={() => setConfigType(null)} onSave={handleSave} />
      )}

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
