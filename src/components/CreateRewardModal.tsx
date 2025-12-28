import { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateRewardModalProps {
  onClose: () => void;
}

export function CreateRewardModal({ onClose }: CreateRewardModalProps) {
  const { addReward } = useGame();
  const [name, setName] = useState('');
  const [cost, setCost] = useState(50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addReward({
      name: name.trim(),
      cost,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] shadow-elevated animate-slide-up flex flex-col safe-area-inset-bottom">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Nova Recompensa</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Recompensa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: 1 hora de videogame"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Custo em Moedas</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCost(Math.max(5, cost - 10))}
                  className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-4xl font-bold text-coin">{cost}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCost(cost + 10)}
                  className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-border p-4 bg-card">
            <Button type="submit" className="w-full" size="lg">
              Adicionar Recompensa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
