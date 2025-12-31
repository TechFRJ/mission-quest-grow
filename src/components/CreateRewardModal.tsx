import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalShell } from '@/components/ModalShell';

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
    <ModalShell
      title="Nova Recompensa"
      onClose={onClose}
      footer={
        <Button type="submit" className="w-full" size="lg">
          Salvar Recompensa
        </Button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
      </form>
    </ModalShell>
  );
}