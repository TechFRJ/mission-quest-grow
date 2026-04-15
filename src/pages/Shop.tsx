import { useState } from 'react';
import { Plus, ShoppingBag, Coins, Package, Gift } from 'lucide-react';
import { useGame, SHOP_ITEMS, Reward } from '@/contexts/GameContext';
import { RewardCard } from '@/components/RewardCard';
import { ShopItemCard } from '@/components/ShopItemCard';
import { CreateRewardModal } from '@/components/CreateRewardModal';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function Shop() {
  const { rewards, stats, deleteReward, purchaseShopItem, hasActiveBoost } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null);
  const [tab, setTab] = useState<'items' | 'rewards'>('items');

  const handleDelete = () => {
    if (deletingReward) {
      deleteReward(deletingReward.id);
      setDeletingReward(null);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 md:px-6 py-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Loja</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Coins className="w-3.5 h-3.5 text-[hsl(var(--coin))]" />
              <span className="font-mono font-bold text-[hsl(var(--coin))]">{stats.coins}</span> moedas disponíveis
            </p>
          </div>
          {tab === 'rewards' && (
            <button onClick={() => setShowCreateModal(true)}
              className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          <button onClick={() => setTab('items')}
            className={cn('flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              tab === 'items' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            <Package className="w-3.5 h-3.5" />
            Power-ups
          </button>
          <button onClick={() => setTab('rewards')}
            className={cn('flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5',
              tab === 'rewards' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
            <Gift className="w-3.5 h-3.5" />
            Recompensas
          </button>
        </div>

        {tab === 'items' && (
          <div className="space-y-2 stagger-children">
            {SHOP_ITEMS.map(item => (
              <ShopItemCard key={item.id} item={item} canAfford={stats.coins >= item.cost} isActive={hasActiveBoost(item.type)} onPurchase={() => purchaseShopItem(item.type)} />
            ))}
          </div>
        )}

        {tab === 'rewards' && (
          <>
            {rewards.length > 0 ? (
              <div className="space-y-2 stagger-children">
                {rewards.map(reward => (
                  <RewardCard key={reward.id} reward={reward} onDelete={() => setDeletingReward(reward)} />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl p-8 text-center border border-border">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">Loja vazia</h3>
                <p className="text-xs text-muted-foreground mb-4">Adicione recompensas personalizadas!</p>
                <button onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Recompensa
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showCreateModal && <CreateRewardModal onClose={() => setShowCreateModal(false)} />}

      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recompensa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingReward?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
