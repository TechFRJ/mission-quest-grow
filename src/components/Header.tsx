import { Coins, Sparkles } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';

export function Header() {
  const { stats } = useGame();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">QuestLife</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="stat-badge level">
            <span className="text-xs">Nv.</span>
            <span className="font-bold">{stats.level}</span>
          </div>
          <div className="stat-badge coin">
            <Coins className="w-4 h-4" />
            <span className="font-bold">{stats.coins}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
