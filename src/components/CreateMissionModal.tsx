import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { DAY_NAMES, Mission } from '@/lib/storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ModalShell } from '@/components/ModalShell';

interface CreateMissionModalProps {
  onClose: () => void;
  editMission?: Mission | null;
}

export function CreateMissionModal({ onClose, editMission }: CreateMissionModalProps) {
  const { addMission, updateMission } = useGame();
  const [title, setTitle] = useState(editMission?.title || '');
  const [category, setCategory] = useState(editMission?.category || '');
  const [type, setType] = useState<'normal' | 'daily'>(editMission?.type || 'normal');
  const [validDays, setValidDays] = useState<number[]>(editMission?.validDays || [0, 1, 2, 3, 4, 5, 6]);
  const [exp, setExp] = useState(editMission?.exp || 25);
  const [coins, setCoins] = useState(editMission?.coins || 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) return;

    const missionData = {
      title: title.trim(),
      category: category.trim(),
      type,
      validDays: type === 'daily' ? validDays : [],
      exp,
      coins,
      active: true,
    };

    if (editMission) {
      updateMission(editMission.id, missionData);
    } else {
      addMission(missionData);
    }
    onClose();
  };

  const toggleDay = (day: number) => {
    if (validDays.includes(day)) {
      setValidDays(validDays.filter(d => d !== day));
    } else {
      setValidDays([...validDays, day].sort());
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <ModalShell
        title={editMission ? 'Editar Missão' : 'Nova Missão'}
        onClose={onClose}
        footer={
          <Button type="submit" className="w-full" size="lg">
            {editMission 
              ? (type === 'daily' ? 'Atualizar Missão Diária' : 'Atualizar Missão')
              : (type === 'daily' ? 'Salvar Missão Diária' : 'Salvar Missão')
            }
          </Button>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Estudar 1 hora"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Estudos, Saúde, Trabalho"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('normal')}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all',
                  type === 'normal'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium">Normal</div>
                <div className="text-xs text-muted-foreground">Uma vez</div>
              </button>
              <button
                type="button"
                onClick={() => setType('daily')}
                className={cn(
                  'p-3 rounded-lg border-2 text-center transition-all',
                  type === 'daily'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="font-medium">Diária</div>
                <div className="text-xs text-muted-foreground">Repete</div>
              </button>
            </div>
          </div>

          {type === 'daily' && (
            <div className="space-y-2">
              <Label>Dias válidos</Label>
              <div className="flex gap-1">
                {DAY_NAMES.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                      validDays.includes(index)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>EXP</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExp(Math.max(5, exp - 5))}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-exp">{exp}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setExp(exp + 5)}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Moedas</Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCoins(Math.max(0, coins - 5))}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-2xl font-bold text-coin">{coins}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCoins(coins + 5)}
                  className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>
    </form>
  );
}
