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
      <main className="container px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loja</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-coin" />
              <span className="font-mono font-bold text-coin">{stats.coins}</span> moedas
            </p>
          </div>
          {tab === 'rewards' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          <button
            onClick={() => setTab('items')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              tab === 'items' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
            )}
          >
            <Package className="w-4 h-4" />
            Power-ups
          </button>
          <button
            onClick={() => setTab('rewards')}
            className={cn(
              'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2',
              tab === 'rewards' ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground'
            )}
          >
            <Gift className="w-4 h-4" />
            Recompensas
          </button>
        </div>

        {/* Items Tab */}
        {tab === 'items' && (
          <div className="space-y-3 stagger-children">
            {SHOP_ITEMS.map((item) => (
              <ShopItemCard
                key={item.id}
                item={item}
                canAfford={stats.coins >= item.cost}
                isActive={hasActiveBoost(item.type)}
                onPurchase={() => purchaseShopItem(item.type)}
              />
            ))}
          </div>
        )}

        {/* Rewards Tab */}
        {tab === 'rewards' && (
          <>
            {rewards.length > 0 ? (
              <div className="space-y-3 stagger-children">
                {rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    onDelete={() => setDeletingReward(reward)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-xl p-8 text-center shadow-soft">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-2">Loja vazia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione recompensas personalizadas!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Recompensa
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showCreateModal && (
        <CreateRewardModal onClose={() => setShowCreateModal(false)} />
      )}

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
