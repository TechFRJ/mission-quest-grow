import { Lock, Trophy } from 'lucide-react';
import { BADGES, BadgeDefinition } from '@/lib/badges';
import { UnlockedBadge } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface BadgeGridProps {
  unlocked: UnlockedBadge[];
}

export function BadgeGrid({ unlocked }: BadgeGridProps) {
  const unlockedSet = new Set(unlocked.map(u => u.badgeId));

  const categories = [
    { key: 'missions', label: 'Missões' },
    { key: 'streaks', label: 'Streaks' },
    { key: 'xp', label: 'Experiência' },
    { key: 'special', label: 'Especiais' },
  ] as const;

  return (
    <div className="space-y-4">
      {categories.map(cat => {
        const badges = BADGES.filter(b => b.category === cat.key);
        return (
          <div key={cat.key}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              {cat.label}
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {badges.map(badge => {
                const isUnlocked = unlockedSet.has(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={cn(
                      'relative flex flex-col items-center justify-center p-2 rounded-xl text-center transition-all',
                      isUnlocked
                        ? 'bg-card shadow-soft'
                        : 'bg-secondary/30 opacity-50'
                    )}
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <span className={cn('text-2xl', !isUnlocked && 'grayscale')}>
                      {badge.icon}
                    </span>
                    <p className="text-[9px] font-medium text-foreground mt-1 leading-tight truncate w-full">
                      {badge.name}
                    </p>
                    {!isUnlocked && (
                      <div className="absolute top-1 right-1">
                        <Lock className="w-2.5 h-2.5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground text-center mt-2">
        {unlocked.length} de {BADGES.length} conquistas desbloqueadas
      </p>
    </div>
  );
}
