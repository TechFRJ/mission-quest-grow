import { Coins, Gift, Trash2 } from 'lucide-react';
import { Reward } from '@/lib/storage';
import { useGame } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

interface RewardCardProps {
  reward: Reward;
  onDelete?: () => void;
}

export function RewardCard({ reward, onDelete }: RewardCardProps) {
  const { stats, purchaseReward } = useGame();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const canAfford = stats.coins >= reward.cost;

  const handlePurchase = () => {
    if (!canAfford || isPurchasing) return;
    
    setIsPurchasing(true);
    
    setTimeout(() => {
      const success = purchaseReward(reward.id);
      if (success) {
        toast.success(`Você resgatou: ${reward.name}! 🎁`, {
          description: `${reward.cost} moedas gastas`,
        });
      }
      setIsPurchasing(false);
    }, 300);
  };

  return (
    <div className={cn(
      'bg-card rounded-xl p-4 shadow-soft transition-all',
      isPurchasing && 'animate-bounce-coin'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Gift className="w-6 h-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground">{reward.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-coin">
            <Coins className="w-4 h-4" />
            <span className="font-bold">{reward.cost}</span>
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
              'px-4 py-2 rounded-lg font-medium text-sm transition-all',
              canAfford
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {isPurchasing ? '...' : 'Resgatar'}
          </button>
        </div>
      </div>
    </div>
  );
}
