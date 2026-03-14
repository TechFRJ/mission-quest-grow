import { useState } from 'react';
import { Plus, Minus, Loader2, AlertTriangle } from 'lucide-react';
import { useGame, Mission, DAY_NAMES } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ModalShell } from '@/components/ModalShell';

const CATEGORIES = [
  { value: 'trabalho', label: 'Trabalho', icon: '💼' },
  { value: 'saúde', label: 'Saúde', icon: '💪' },
  { value: 'estudos', label: 'Aprendizado', icon: '📚' },
  { value: 'finanças', label: 'Finanças', icon: '💰' },
  { value: 'pessoal', label: 'Pessoal', icon: '🧘' },
  { value: 'programação', label: 'Programação', icon: '💻' },
  { value: 'outros', label: 'Outros', icon: '📦' },
];

const PRIORITIES = [
  { value: 'low', label: 'Baixa', color: 'text-muted-foreground bg-secondary' },
  { value: 'medium', label: 'Média', color: 'text-coin bg-coin/10' },
  { value: 'high', label: 'Alta', color: 'text-destructive bg-destructive/10' },
] as const;

interface CreateMissionModalProps {
  onClose: () => void;
  editMission?: Mission | null;
}

export function CreateMissionModal({ onClose, editMission }: CreateMissionModalProps) {
  const { addMission, updateMission } = useGame();
  const [title, setTitle] = useState(editMission?.title || '');
  const [description, setDescription] = useState(editMission?.description || '');
  const [category, setCategory] = useState(editMission?.category || '');
  const [type, setType] = useState<'normal' | 'daily'>(editMission?.type || 'normal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(editMission?.priority || 'medium');
  const [deadline, setDeadline] = useState(editMission?.deadline || '');
  const [validDays, setValidDays] = useState<number[]>(editMission?.validDays || [0, 1, 2, 3, 4, 5, 6]);
  const [exp, setExp] = useState(editMission?.xp || 25);
  const [coins, setCoins] = useState(editMission?.coins || 10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const missionData = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        type,
        priority,
        deadline: deadline || null,
        validDays: type === 'daily' ? validDays : [],
        xp: exp,
        coins,
        active: true,
      };

      if (editMission) {
        await updateMission(editMission.id, missionData);
      } else {
        await addMission(missionData);
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
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
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!title.trim() || !category.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : editMission ? 'Atualizar Missão' : 'Salvar Missão'}
          </Button>
        }
      >
        <div className="space-y-5">
          {/* Title */}
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a missão..."
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={cn(
                    'p-2 rounded-lg text-center transition-all text-xs',
                    category === cat.value
                      ? 'border-2 border-primary bg-primary/5 text-primary'
                      : 'border border-border hover:border-primary/50'
                  )}
                >
                  <span className="text-lg block">{cat.icon}</span>
                  <span className="mt-0.5 block truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
                    priority === p.value
                      ? `${p.color} border-current`
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Prazo (opcional)</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Type */}
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

          {/* XP & Coins */}
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
