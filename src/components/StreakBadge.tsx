import { Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
  currentStreak: number;
  maxStreak: number;
  compact?: boolean;
}

export function StreakBadge({ currentStreak, maxStreak, compact = false }: StreakBadgeProps) {
  if (currentStreak === 0 && maxStreak === 0) return null;

  const isHot = currentStreak >= 7;
  const isRecord = currentStreak === maxStreak && currentStreak > 0;

  if (compact) {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 text-xs font-bold font-mono',
        isHot ? 'text-streak streak-glow' : 'text-muted-foreground'
      )}>
        <Flame className={cn('w-3.5 h-3.5', isHot && 'animate-fire-pulse')} />
        <span>{currentStreak}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold font-mono',
        isHot
          ? 'bg-streak/15 text-streak shadow-glow-streak'
          : 'bg-secondary text-muted-foreground'
      )}>
        <Flame className={cn('w-4 h-4', isHot && 'animate-fire-pulse')} />
        <span>{currentStreak}</span>
      </div>
      {maxStreak > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Trophy className="w-3 h-3" />
          <span className="font-mono">{maxStreak}</span>
        </div>
      )}
    </div>
  );
}
