import { useState } from 'react';
import { Plus, ShoppingBag, Coins } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { RewardCard } from '@/components/RewardCard';
import { CreateRewardModal } from '@/components/CreateRewardModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Reward } from '@/lib/storage';

export function Shop() {
  const { rewards, stats, deleteReward } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingReward, setDeletingReward] = useState<Reward | null>(null);

  const handleDelete = () => {
    if (deletingReward) {
      deleteReward(deletingReward.id);
      setDeletingReward(null);
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Loja</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Coins className="w-4 h-4 text-coin" />
              {stats.coins} moedas disponíveis
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Rewards */}
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
            <h3 className="font-medium text-foreground mb-2">
              Loja vazia
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione recompensas para gastar suas moedas!
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
      </main>

      {showCreateModal && (
        <CreateRewardModal onClose={() => setShowCreateModal(false)} />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir recompensa?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingReward?.name}"? Esta ação não pode ser desfeita.
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
