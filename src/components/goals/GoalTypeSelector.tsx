import { GoalType } from '@/hooks/useGoals';
import { ModalShell } from '@/components/ModalShell';

const GOAL_TYPES: { type: GoalType; icon: string; name: string; desc: string }[] = [
  { type: 'study', icon: '📚', name: 'Estudo', desc: 'Tempo de foco' },
  { type: 'gym', icon: '💪', name: 'Academia', desc: 'Dias na semana' },
  { type: 'finance', icon: '💰', name: 'Finanças', desc: 'Valor a poupar' },
  { type: 'hydration', icon: '💧', name: 'Hidratação', desc: 'Litros por dia' },
  { type: 'reading', icon: '📖', name: 'Leitura', desc: 'Páginas/livros' },
  { type: 'meditation', icon: '🧘', name: 'Meditação', desc: 'Minutos por dia' },
  { type: 'sleep', icon: '😴', name: 'Sono', desc: 'Horas de sono' },
  { type: 'language', icon: '🗣️', name: 'Idiomas', desc: 'Min de estudo' },
];

interface Props {
  onSelect: (type: GoalType) => void;
  onClose: () => void;
}

export function GoalTypeSelector({ onSelect, onClose }: Props) {
  return (
    <ModalShell title="Qual meta você quer criar?" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {GOAL_TYPES.map(t => (
          <button
            key={t.type}
            onClick={() => onSelect(t.type)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-center group"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{t.icon}</span>
            <span className="text-sm font-semibold text-foreground">{t.name}</span>
            <span className="text-[11px] text-muted-foreground">{t.desc}</span>
          </button>
        ))}
      </div>
    </ModalShell>
  );
}
