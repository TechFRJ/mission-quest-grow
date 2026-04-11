import { useState } from 'react';
import { GoalType, GoalConfig } from '@/hooks/useGoals';
import { ModalShell } from '@/components/ModalShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const COLORS = ['#00d4ff', '#7c3aed', '#00ff88', '#ff6b35', '#f43f5e', '#eab308'];
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface Props {
  type: GoalType;
  onClose: () => void;
  onSave: (data: { name: string; color: string; config: GoalConfig }) => void;
  initial?: { name: string; color: string; config: GoalConfig };
}

export function GoalConfigModal({ type, onClose, onSave, initial }: Props) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [config, setConfig] = useState<GoalConfig>(initial?.config || getDefaults(type));

  const upd = (partial: Partial<GoalConfig>) => setConfig(prev => ({ ...prev, ...partial }));

  const title = initial ? 'Editar Meta' : 'Criar Meta';

  return (
    <ModalShell
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button
            onClick={() => name.trim() && onSave({ name: name.trim(), color, config })}
            disabled={!name.trim()}
            className="flex-1"
          >
            {initial ? 'Salvar' : 'Criar Meta'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nome da meta</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder={getPlaceholder(type)} className="bg-muted" />
        </div>

        {/* Type-specific fields */}
        {type === 'study' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Meta de horas</label>
              <Input type="number" value={config.totalHours || ''} onChange={e => upd({ totalHours: Number(e.target.value) })} placeholder="15" className="bg-muted" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <div className="flex gap-2">
                {(['weekly', 'monthly'] as const).map(p => (
                  <button key={p} onClick={() => upd({ period: p })} className={cn('flex-1 py-2 rounded-lg text-sm border transition-all', config.period === p ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    {p === 'weekly' ? 'Semanal' : 'Mensal'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {type === 'gym' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dias por semana: {config.daysPerWeek || 5}</label>
              <Slider value={[config.daysPerWeek || 5]} onValueChange={([v]) => upd({ daysPerWeek: v })} min={1} max={7} step={1} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dias pretendidos</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => {
                  const selected = (config.targetDays || []).includes(i);
                  return (
                    <button key={i} onClick={() => {
                      const days = [...(config.targetDays || [])];
                      if (selected) days.splice(days.indexOf(i), 1); else days.push(i);
                      upd({ targetDays: days });
                    }} className={cn('w-10 h-10 rounded-full text-xs font-semibold border transition-all', selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {type === 'finance' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Valor da meta (R$)</label>
              <Input type="number" value={config.targetAmount || ''} onChange={e => upd({ targetAmount: Number(e.target.value) })} placeholder="500" className="bg-muted" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Período</label>
              <div className="flex gap-2">
                {(['monthly', 'total'] as const).map(p => (
                  <button key={p} onClick={() => upd({ financePeriod: p })} className={cn('flex-1 py-2 rounded-lg text-sm border transition-all', config.financePeriod === p ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    {p === 'monthly' ? 'Mensal' : 'Total (sem prazo)'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {type === 'hydration' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Meta diária: {config.litersPerDay || 2}L</label>
            <Slider value={[config.litersPerDay || 2]} onValueChange={([v]) => upd({ litersPerDay: v })} min={1} max={4} step={0.25} />
          </div>
        )}

        {type === 'reading' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Modo</label>
              <div className="flex gap-2">
                {(['pages', 'books'] as const).map(m => (
                  <button key={m} onClick={() => upd({ readingMode: m })} className={cn('flex-1 py-2 rounded-lg text-sm border transition-all', config.readingMode === m ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    {m === 'pages' ? 'Páginas/dia' : 'Livros/mês'}
                  </button>
                ))}
              </div>
            </div>
            {config.readingMode === 'pages' ? (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Páginas por dia</label>
                <Input type="number" value={config.pagesPerDay || ''} onChange={e => upd({ pagesPerDay: Number(e.target.value) })} placeholder="30" className="bg-muted" />
              </div>
            ) : (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Livros por mês</label>
                <Input type="number" value={config.booksPerMonth || ''} onChange={e => upd({ booksPerMonth: Number(e.target.value) })} placeholder="2" className="bg-muted" />
              </div>
            )}
          </>
        )}

        {type === 'meditation' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Minutos por dia: {config.minutesPerDay || 10}</label>
              <Slider value={[config.minutesPerDay || 10]} onValueChange={([v]) => upd({ minutesPerDay: v })} min={5} max={60} step={5} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Dias da semana</label>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => {
                  const selected = (config.meditationDays || [0,1,2,3,4,5,6]).includes(i);
                  return (
                    <button key={i} onClick={() => {
                      const days = [...(config.meditationDays || [0,1,2,3,4,5,6])];
                      if (selected) days.splice(days.indexOf(i), 1); else days.push(i);
                      upd({ meditationDays: days });
                    }} className={cn('w-10 h-10 rounded-full text-xs font-semibold border transition-all', selected ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {type === 'sleep' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Horas por noite: {config.hoursPerNight || 8}</label>
              <Slider value={[config.hoursPerNight || 8]} onValueChange={([v]) => upd({ hoursPerNight: v })} min={6} max={10} step={0.5} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Horário alvo de dormir</label>
              <Input type="time" value={config.targetBedtime || '23:00'} onChange={e => upd({ targetBedtime: e.target.value })} className="bg-muted" />
            </div>
          </>
        )}

        {type === 'language' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Idioma</label>
              <Input value={config.language || ''} onChange={e => upd({ language: e.target.value })} placeholder="Inglês" className="bg-muted" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Minutos por dia: {config.langMinutesPerDay || 15}</label>
              <Slider value={[config.langMinutesPerDay || 15]} onValueChange={([v]) => upd({ langMinutesPerDay: v })} min={5} max={120} step={5} />
            </div>
          </>
        )}

        {/* Color picker */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Cor do card</label>
          <div className="flex gap-3">
            {COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn('w-8 h-8 rounded-full border-2 transition-all', color === c ? 'border-foreground scale-110' : 'border-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function getDefaults(type: GoalType): GoalConfig {
  switch (type) {
    case 'study': return { totalHours: 15, period: 'weekly' };
    case 'gym': return { daysPerWeek: 5, targetDays: [0,1,2,3,4] };
    case 'finance': return { targetAmount: 500, financePeriod: 'monthly' };
    case 'hydration': return { litersPerDay: 2 };
    case 'reading': return { readingMode: 'pages', pagesPerDay: 30 };
    case 'meditation': return { minutesPerDay: 10, meditationDays: [0,1,2,3,4,5,6] };
    case 'sleep': return { hoursPerNight: 8, targetBedtime: '23:00' };
    case 'language': return { language: '', langMinutesPerDay: 15 };
  }
}

function getPlaceholder(type: GoalType): string {
  const map: Record<GoalType, string> = {
    study: 'Estudar React',
    gym: 'Musculação',
    finance: 'Reserva de emergência',
    hydration: 'Beber água',
    reading: '12 livros em 2025',
    meditation: 'Meditar diariamente',
    sleep: 'Dormir melhor',
    language: 'Inglês fluente',
  };
  return map[type];
}
