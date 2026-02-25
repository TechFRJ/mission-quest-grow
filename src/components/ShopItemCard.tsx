import { Zap, Coffee, RotateCcw, Star, Coins, Loader2 } from 'lucide-react';
import { ShopItem } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const ICON_MAP: Record<string, any> = {
  Zap, Coffee, RotateCcw, Star,
};

interface ShopItemCardProps {
  item: ShopItem;
  canAfford: boolean;
  isActive: boolean;
  onPurchase: () => Promise<boolean>;
}

export function ShopItemCard({ item, canAfford, isActive, onPurchase }: ShopItemCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const Icon = ICON_MAP[item.icon] || Zap;

  const handlePurchase = async () => {
    if (!canAfford || isActive || isPurchasing) return;
    setIsPurchasing(true);
    try {
      await onPurchase();
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <div className={cn(
      'bg-card rounded-xl p-4 shadow-soft border border-border transition-all',
      isActive && 'border-primary/30 shadow-glow-primary'
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
          isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
          {item.durationHours && (
            <span className="text-xs text-muted-foreground/70 mt-1 inline-block">
              Duração: {item.durationHours}h
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-coin font-mono text-sm font-bold">
            <Coins className="w-3.5 h-3.5" />
            {item.cost}
          </div>
          <button
            onClick={handlePurchase}
            disabled={!canAfford || isActive || isPurchasing}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
              isActive
                ? 'bg-primary/10 text-primary cursor-default'
                : canAfford
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
            )}
          >
            {isPurchasing ? <Loader2 className="w-3 h-3 animate-spin" /> : isActive ? 'Ativo' : 'Comprar'}
          </button>
        </div>
      </div>
    </div>
  );
}
