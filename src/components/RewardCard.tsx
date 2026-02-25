import { Coins, Gift, Trash2, Loader2 } from 'lucide-react';
import { Reward } from '@/contexts/GameContext';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface RewardCardProps {
  reward: Reward;
  onDelete?: () => void;
}

export function RewardCard({ reward, onDelete }: RewardCardProps) {
  const { stats, purchaseReward } = useGame();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const canAfford = stats.coins >= reward.cost;

  const handlePurchase = async () => {
    if (!canAfford || isPurchasing) return;
    setIsPurchasing(true);
    try {
      await purchaseReward(reward.id);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft transition-all">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-5 h-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm">{reward.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-coin font-mono text-sm font-bold">
            <Coins className="w-3.5 h-3.5" />
            {reward.cost}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handlePurchase}
            disabled={!canAfford || isPurchasing}
            className={cn(
              'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all',
              canAfford
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {isPurchasing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Resgatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
