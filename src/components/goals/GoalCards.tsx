import { useState } from 'react';
import { Goal, useGoals } from '@/hooks/useGoals';
import { Play, Check, Plus, MoreVertical, Trash2, RotateCcw, Pencil, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TimerOverlay } from './TimerOverlay';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const TYPE_ICONS: Record<string, string> = {
  study: '📚', gym: '💪', finance: '💰', hydration: '💧',
  reading: '📖', meditation: '🧘', sleep: '😴', language: '🗣️',
};

interface CardProps {
  goal: Goal;
  hooks: ReturnType<typeof useGoals>;
  onEdit: (goal: Goal) => void;
}

function GoalMenu({ goal, hooks, onEdit }: CardProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 text-muted-foreground hover:text-foreground"><MoreVertical className="w-4 h-4" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem onClick={() => onEdit(goal)} className="gap-2"><Pencil className="w-3 h-3" />Editar</DropdownMenuItem>
        <DropdownMenuItem onClick={() => hooks.resetProgress(goal.id)} className="gap-2"><RotateCcw className="w-3 h-3" />Resetar progresso</DropdownMenuItem>
        <DropdownMenuItem onClick={() => hooks.deleteGoal(goal.id)} className="gap-2 text-destructive"><Trash2 className="w-3 h-3" />Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---- STUDY / LANGUAGE / MEDITATION cards (timer-based) ----
function TimerGoalCard({ goal, hooks, onEdit }: CardProps) {
  const [timerOpen, setTimerOpen] = useState(false);
  const isStudy = goal.type === 'study';
  const isLang = goal.type === 'language';
  const isMed = goal.type === 'meditation';

  const period = goal.config.period || 'weekly';
  const totalSecs = period === 'weekly' ? hooks.getWeekSeconds(goal) : hooks.getMonthSeconds(goal);

  let targetSecs: number;
  if (isMed) targetSecs = (goal.config.minutesPerDay || 10) * 60; // daily
  else if (isLang) targetSecs = (goal.config.langMinutesPerDay || 15) * 60; // daily
  else targetSecs = (goal.config.totalHours || 15) * 3600; // weekly/monthly

  // For daily goals, use today's seconds
  const displaySecs = (isMed || isLang)
    ? ((goal.progress.dailySeconds || {})[new Date().toISOString().slice(0, 10)] || 0)
    : totalSecs;

  const pct = Math.min((displaySecs / targetSecs) * 100, 100);

  const formatTime = (s: number) => {
    if (s >= 3600) return `${(s / 3600).toFixed(1)}h`;
    return `${Math.floor(s / 60)}min`;
  };

  const formatTarget = () => {
    if (isMed) return `${goal.config.minutesPerDay}min/dia`;
    if (isLang) return `${goal.config.langMinutesPerDay}min/dia`;
    return `${goal.config.totalHours}h/${period === 'weekly' ? 'sem' : 'mês'}`;
  };

  const last7 = hooks.getLast7Days(goal, 'dailySeconds');
  const maxVal = Math.max(...last7.map(d => d.value), 1);
  const streak = (isLang) ? hooks.getStreak(goal) : 0;

  return (
    <>
      <div className="neon-card group" style={{ borderColor: `${goal.color}33` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TYPE_ICONS[goal.type]}</span>
            <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
          </div>
          <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progresso {isMed || isLang ? 'hoje' : period === 'weekly' ? 'semanal' : 'mensal'}</span>
            <span className="font-mono font-bold" style={{ color: goal.color }}>{formatTime(displaySecs)} / {formatTarget()}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
          </div>
        </div>

        <Button onClick={() => setTimerOpen(true)} variant="outline" className="w-full mb-3 gap-2 border-border hover:border-primary/50">
          <Play className="w-4 h-4" /> Iniciar Sessão
        </Button>

        {isLang && streak > 0 && (
          <div className="text-center text-xs font-mono mb-2">
            <span className="text-streak">🔥 {streak} dia{streak > 1 ? 's' : ''} seguido{streak > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Mini chart */}
        <div className="flex items-end gap-1 h-8">
          {last7.map(d => (
            <div key={d.date} className="flex-1 rounded-sm transition-all" style={{
              height: `${Math.max((d.value / maxVal) * 100, 4)}%`,
              backgroundColor: d.value > 0 ? `${goal.color}80` : 'hsl(var(--muted))',
            }} />
          ))}
        </div>

        {pct >= 100 && <div className="mt-2 text-center text-xs font-bold animate-pulse" style={{ color: goal.color }}>✅ Meta concluída!</div>}
      </div>
      {timerOpen && (
        <TimerOverlay
          goalName={goal.name}
          onSave={(secs) => hooks.addSeconds(goal.id, secs)}
          onClose={() => setTimerOpen(false)}
        />
      )}
    </>
  );
}

// ---- GYM card ----
function GymGoalCard({ goal, hooks, onEdit }: CardProps) {
  const weekDates = hooks.getWeekDates();
  const todayStr = new Date().toISOString().slice(0, 10);
  const checked = goal.progress.checkedDays || [];
  const weekCount = hooks.getGymWeekCount(goal);
  const target = goal.config.daysPerWeek || 5;
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="neon-card" style={{ borderColor: `${goal.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💪</span>
          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
        </div>
        <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-3">
        {weekDates.map((d, i) => {
          const done = checked.includes(d);
          const isToday = d === todayStr;
          const isFuture = d > todayStr;
          return (
            <div key={d} className="flex flex-col items-center gap-1">
              <span className="text-[9px] text-muted-foreground">{dayLabels[i]}</span>
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                done && 'text-background',
                !done && !isFuture && 'bg-muted border border-border',
                isFuture && 'bg-muted/30 border border-border/30 opacity-40',
                isToday && !done && 'neon-pulse border-primary',
              )} style={done ? { backgroundColor: goal.color } : undefined}>
                {done ? <Check className="w-3.5 h-3.5" /> : new Date(d + 'T12:00:00').getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <Button
        onClick={() => hooks.toggleGymDay(goal.id)}
        variant="outline"
        className="w-full mb-2 gap-2 border-border"
      >
        <Check className="w-4 h-4" /> {checked.includes(todayStr) ? 'Desmarcar Hoje' : '✓ FUI HOJE'}
      </Button>

      <div className="text-center text-xs font-mono">
        <span className="font-bold" style={{ color: goal.color }}>{weekCount}</span>
        <span className="text-muted-foreground"> / {target} dias</span>
      </div>

      {weekCount >= target && <div className="mt-2 text-center text-xs font-bold animate-pulse" style={{ color: goal.color }}>🏆 Meta atingida!</div>}
    </div>
  );
}

// ---- FINANCE card ----
function FinanceGoalCard({ goal, hooks, onEdit }: CardProps) {
  const [amount, setAmount] = useState('');
  const total = hooks.getFinanceTotal(goal);
  const target = goal.config.targetAmount || 500;
  const pct = Math.min((total / target) * 100, 100);
  const remaining = Math.max(target - total, 0);
  const entries = (goal.progress.financeEntries || []);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="neon-card" style={{ borderColor: `${goal.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💰</span>
          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
        </div>
        <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle cx="50" cy="50" r={radius} fill="none" stroke={goal.color} strokeWidth="8"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono font-bold text-sm">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-mono font-bold text-lg">R$ {total.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">Meta: R$ {target.toFixed(2)}</div>
          {remaining > 0 && <div className="text-xs mt-1" style={{ color: goal.color }}>Faltam R$ {remaining.toFixed(2)}</div>}
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <Input type="number" placeholder="Valor (R$)" value={amount} onChange={e => setAmount(e.target.value)} className="bg-muted" />
        <Button onClick={() => { const v = parseFloat(amount); if (v > 0) { hooks.addFinanceEntry(goal.id, v); setAmount(''); } }} variant="outline" className="shrink-0 gap-1">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {entries.length > 0 && (
        <div className="max-h-24 overflow-y-auto no-scrollbar space-y-1">
          {entries.slice().reverse().slice(0, 5).map(e => (
            <div key={e.id} className="flex justify-between text-[11px] py-1 px-2 rounded bg-muted/50">
              <span className="text-muted-foreground">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              <span className="font-mono font-bold" style={{ color: goal.color }}>+ R$ {e.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {pct >= 100 && <div className="mt-2 text-center text-xs font-bold animate-pulse" style={{ color: goal.color }}>🏆 Meta atingida!</div>}
    </div>
  );
}

// ---- HYDRATION card ----
function HydrationGoalCard({ goal, hooks, onEdit }: CardProps) {
  const todayCups = hooks.getTodayCups(goal);
  const targetCups = Math.ceil((goal.config.litersPerDay || 2) * 4); // 250ml cups
  const pct = Math.min((todayCups / targetCups) * 100, 100);

  return (
    <div className="neon-card" style={{ borderColor: `${goal.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💧</span>
          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
        </div>
        <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
      </div>

      <div className="text-center mb-3">
        <div className="text-2xl font-mono font-bold" style={{ color: goal.color }}>{todayCups} / {targetCups}</div>
        <div className="text-xs text-muted-foreground">copos de 250ml ({(todayCups * 0.25).toFixed(2)}L / {goal.config.litersPerDay}L)</div>
      </div>

      {/* Visual cups */}
      <div className="flex flex-wrap gap-2 justify-center mb-3">
        {Array.from({ length: targetCups }).map((_, i) => (
          <div key={i} className={cn('w-6 h-8 rounded-b-lg border transition-all', i < todayCups ? 'border-transparent' : 'border-border bg-muted/30')}
            style={i < todayCups ? { backgroundColor: `${goal.color}60` } : undefined}>
            {i < todayCups && <Droplets className="w-3 h-3 mx-auto mt-1.5" style={{ color: goal.color }} />}
          </div>
        ))}
      </div>

      <Button onClick={() => hooks.addCup(goal.id)} variant="outline" className="w-full gap-2 border-border" disabled={todayCups >= targetCups}>
        <Droplets className="w-4 h-4" /> + Copo
      </Button>

      {pct >= 100 && <div className="mt-2 text-center text-xs font-bold animate-pulse" style={{ color: goal.color }}>💧 Hidratação completa!</div>}
    </div>
  );
}

// ---- READING card ----
function ReadingGoalCard({ goal, hooks, onEdit }: CardProps) {
  const [pages, setPages] = useState('');
  const todayPages = hooks.getTodayPages(goal);
  const target = goal.config.pagesPerDay || 30;
  const pct = Math.min((todayPages / target) * 100, 100);

  return (
    <div className="neon-card" style={{ borderColor: `${goal.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
        </div>
        <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Hoje</span>
          <span className="font-mono font-bold" style={{ color: goal.color }}>{todayPages} / {target} pág</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
        </div>
      </div>

      <div className="flex gap-2">
        <Input type="number" placeholder="Páginas" value={pages} onChange={e => setPages(e.target.value)} className="bg-muted" />
        <Button onClick={() => { const v = parseInt(pages); if (v > 0) { hooks.addPages(goal.id, v); setPages(''); } }} variant="outline" className="shrink-0 gap-1">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {pct >= 100 && <div className="mt-2 text-center text-xs font-bold animate-pulse" style={{ color: goal.color }}>📖 Meta de leitura batida!</div>}
    </div>
  );
}

// ---- SLEEP card ----
function SleepGoalCard({ goal, hooks, onEdit }: CardProps) {
  const [hours, setHours] = useState('');
  const avg = hooks.getSleepAverage(goal);
  const target = goal.config.hoursPerNight || 8;
  const pct = Math.min((avg / target) * 100, 100);
  const last7 = hooks.getLast7Days(goal, 'dailySleepHours');

  return (
    <div className="neon-card" style={{ borderColor: `${goal.color}33` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">😴</span>
          <h3 className="text-sm font-bold text-foreground truncate">{goal.name}</h3>
        </div>
        <GoalMenu goal={goal} hooks={hooks} onEdit={onEdit} />
      </div>

      <div className="text-center mb-3">
        <div className="text-2xl font-mono font-bold" style={{ color: goal.color }}>{avg.toFixed(1)}h</div>
        <div className="text-xs text-muted-foreground">média 7 dias · meta: {target}h/noite</div>
      </div>

      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
      </div>

      <div className="flex gap-2 mb-3">
        <Input type="number" placeholder="Horas dormidas" value={hours} onChange={e => setHours(e.target.value)} step="0.5" className="bg-muted" />
        <Button onClick={() => { const v = parseFloat(hours); if (v > 0) { hooks.logSleep(goal.id, v); setHours(''); } }} variant="outline" className="shrink-0">
          Registrar
        </Button>
      </div>

      <div className="flex items-end gap-1 h-8">
        {last7.map(d => (
          <div key={d.date} className="flex-1 rounded-sm transition-all" style={{
            height: `${d.value > 0 ? Math.max((d.value / 12) * 100, 10) : 4}%`,
            backgroundColor: d.value > 0 ? `${goal.color}80` : 'hsl(var(--muted))',
          }} />
        ))}
      </div>
    </div>
  );
}

// ---- Renderer ----
export function GoalCard({ goal, hooks, onEdit }: CardProps) {
  switch (goal.type) {
    case 'study':
    case 'language':
    case 'meditation':
      return <TimerGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    case 'gym':
      return <GymGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    case 'finance':
      return <FinanceGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    case 'hydration':
      return <HydrationGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    case 'reading':
      return <ReadingGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    case 'sleep':
      return <SleepGoalCard goal={goal} hooks={hooks} onEdit={onEdit} />;
    default:
      return null;
  }
}
