import { Check, Coins, Sparkles, Tag, Flame, AlertTriangle, Clock, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { Mission, useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { StreakBadge } from '@/components/StreakBadge';

interface MissionCardProps {
  mission: Mission;
  onComplete?: () => void;
  showCompleteButton?: boolean;
  completed?: boolean;
}

function isDeadlineNear(deadline: string | null): boolean {
  if (!deadline) return false;
  const diff = new Date(deadline).getTime() - Date.now();
  return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000; // 2 days
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

const PRIORITY_CONFIG = {
  high: { icon: ArrowUp, label: 'Alta', className: 'text-destructive' },
  medium: { icon: ArrowRight, label: 'Média', className: 'text-coin' },
  low: { icon: ArrowDown, label: 'Baixa', className: 'text-muted-foreground' },
};

export function MissionCard({ mission, onComplete, showCompleteButton = true, completed = false }: MissionCardProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { streaks, hasActiveBoost } = useGame();

  const streak = mission.type === 'daily' ? streaks.find(s => s.missionId === mission.id) : null;
  const hasXpBoost = hasActiveBoost('boost_xp');
  const hasGolden = hasActiveBoost('golden_mission');
  const deadlineNear = isDeadlineNear(mission.deadline);
  const overdue = isOverdue(mission.deadline);
  const priorityInfo = PRIORITY_CONFIG[mission.priority || 'medium'];
  const PriorityIcon = priorityInfo.icon;

  const handleComplete = () => {
    if (isCompleting || completed) return;
    setIsCompleting(true);
    setTimeout(() => {
      onComplete?.();
      setIsCompleting(false);
    }, 300);
  };

  const xpDisplay = mission.xp * (hasGolden ? 3 : hasXpBoost ? 2 : 1);
  const coinsDisplay = mission.coins * (hasGolden ? 3 : 1);

  return (
    <div className={cn(
      'mission-card flex items-center gap-4',
      completed && 'completed',
      isCompleting && 'success-pulse bg-success/5',
      overdue && !completed && 'border border-destructive/30',
    )}>
      {showCompleteButton && (
        <button
          onClick={handleComplete}
          disabled={completed || isCompleting}
          className={cn(
            'w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200',
            completed
              ? 'bg-success border-success text-success-foreground'
              : 'border-border hover:border-primary hover:bg-primary/5',
            isCompleting && 'scale-110 bg-success border-success'
          )}
        >
          {(completed || isCompleting) && <Check className="w-5 h-5" />}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <PriorityIcon className={cn('w-3.5 h-3.5 flex-shrink-0', priorityInfo.className)} />
          <h3 className={cn(
            'font-medium text-foreground truncate text-sm',
            completed && 'line-through text-muted-foreground'
          )}>
            {mission.title}
          </h3>
        </div>
        {mission.description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{mission.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
            <Tag className="w-3 h-3" />
            {mission.category}
          </span>
          {mission.type === 'daily' && (
            <span className="text-xs text-accent font-medium">Diária</span>
          )}
          {streak && streak.currentStreak > 0 && (
            <StreakBadge currentStreak={streak.currentStreak} maxStreak={streak.maxStreak} compact />
          )}
          {mission.deadline && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md',
              overdue ? 'bg-destructive/10 text-destructive' :
              deadlineNear ? 'bg-coin/10 text-coin' :
              'bg-secondary text-muted-foreground'
            )}>
              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
              {new Date(mission.deadline + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className={cn(
          'flex items-center gap-1 text-sm font-mono font-bold',
          (hasXpBoost || hasGolden) ? 'text-primary' : 'text-exp'
        )}>
          <Sparkles className="w-3.5 h-3.5" />
          +{xpDisplay}
        </div>
        {coinsDisplay > 0 && (
          <div className="flex items-center gap-1 text-coin text-sm font-mono font-bold">
            <Coins className="w-3.5 h-3.5" />
            +{coinsDisplay}
          </div>
        )}
      </div>
    </div>
  );
}
