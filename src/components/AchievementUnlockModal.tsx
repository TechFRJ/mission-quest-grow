import { useEffect, useState } from 'react';
import { X, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeDefinition } from '@/lib/badges';

interface AchievementUnlockModalProps {
  badges: BadgeDefinition[];
  onClose: () => void;
}

export function AchievementUnlockModal({ badges, onClose }: AchievementUnlockModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const close = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={cn(
      'fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
      isVisible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className={cn(
        'bg-card rounded-2xl p-8 text-center shadow-xl max-w-sm mx-4 transition-all duration-300 relative',
        isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      )}>
        <button onClick={close} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-full bg-coin/10 flex items-center justify-center mx-auto mb-4 level-up-animation">
          <Trophy className="w-8 h-8 text-coin" />
        </div>

        <h2 className="text-xl font-bold text-foreground mb-1">
          {badges.length === 1 ? 'Conquista Desbloqueada!' : `${badges.length} Conquistas!`}
        </h2>

        <div className="space-y-3 mt-4">
          {badges.map(badge => (
            <div key={badge.id} className="flex items-center gap-3 bg-secondary/50 rounded-xl p-3">
              <span className="text-3xl">{badge.icon}</span>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">{badge.name}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
