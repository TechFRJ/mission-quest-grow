import { useState, useEffect, useRef } from 'react';
import { Crosshair, Play, Pause, RotateCcw, Check, Plus, RefreshCw, BookOpen, Dumbbell, PiggyBank, Lightbulb, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoals } from '@/hooks/useGoals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ---- Study Card ----
function StudyCard({ goals }: { goals: ReturnType<typeof useGoals> }) {
  const [timerOpen, setTimerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goals.study.weeklyGoalHours));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const weekMinutes = goals.getStudyWeekMinutes();
  const goalMinutes = goals.study.weeklyGoalHours * 60;
  const pct = Math.min((weekMinutes / goalMinutes) * 100, 100);
  const hours = (weekMinutes / 60).toFixed(1);
  const last7 = goals.getStudyLast7Days();
  const maxMin = Math.max(...last7.map(d => d.minutes), 1);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const stopAndSave = () => {
    setRunning(false);
    if (seconds >= 60) {
      goals.addStudyMinutes(Math.floor(seconds / 60));
    }
    setSeconds(0);
    setTimerOpen(false);
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="neon-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-display text-sm font-bold tracking-wide">📚 Estudo</h3>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progresso semanal</span>
          <span className="font-mono text-primary font-bold">{hours}h / {goals.study.weeklyGoalHours}h</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Timer button */}
      <Button onClick={() => setTimerOpen(true)} className="w-full mb-4 bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20">
        <Play className="w-4 h-4 mr-2" /> Iniciar Timer
      </Button>

      {/* Last 7 days mini bars */}
      <div className="flex items-end gap-1 h-12">
        {last7.map((d, i) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-muted rounded-sm overflow-hidden" style={{ height: '32px' }}>
              <div
                className="w-full bg-primary/60 rounded-sm transition-all"
                style={{ height: `${(d.minutes / maxMin) * 100}%`, marginTop: 'auto' }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{dayLabels[(new Date(d.date + 'T12:00:00').getDay() + 6) % 7]}</span>
          </div>
        ))}
      </div>

      {pct >= 100 && (
        <div className="mt-3 text-center text-xs text-success font-bold animate-pulse">
          🎉 Meta de estudo atingida!
        </div>
      )}

      {/* Timer Modal */}
      <Dialog open={timerOpen} onOpenChange={(o) => { if (!o) stopAndSave(); else setTimerOpen(true); }}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Cronômetro de Estudo</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <div className="text-5xl font-mono font-bold text-foreground mb-8 tracking-widest">
              {fmt(seconds)}
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => setRunning(!running)}
                variant={running ? 'destructive' : 'default'}
                size="lg"
              >
                {running ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                {running ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button onClick={() => { setRunning(false); setSeconds(0); }} variant="outline" size="lg">
                <RotateCcw className="w-5 h-5 mr-2" /> Resetar
              </Button>
            </div>
            {seconds >= 60 && !running && (
              <p className="text-xs text-muted-foreground mt-4">
                {Math.floor(seconds / 60)} min serão adicionados ao fechar.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-sm">Meta de Estudo (horas/semana)</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} className="bg-muted" />
            <Button onClick={() => { goals.setStudyGoal(Number(goalInput) || 15); setSettingsOpen(false); }}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Gym Card ----
function GymCard({ goals }: { goals: ReturnType<typeof useGoals> }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goals.gym.weeklyGoalDays));
  const weekStatus = goals.getGymWeekStatus();
  const weekCount = goals.getGymWeekCount();
  const todayStr = new Date().toISOString().slice(0, 10);
  const last4 = goals.getGymLast4Weeks();
  const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="neon-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-success" />
          <h3 className="font-display text-sm font-bold tracking-wide">💪 Academia</h3>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {weekStatus.map((d, i) => {
          const isToday = d.date === todayStr;
          const isFuture = d.date > todayStr;
          return (
            <div key={d.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{dayLabels[i]}</span>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  d.done && 'bg-success/20 text-success border border-success/50 glow-success',
                  !d.done && !isFuture && 'bg-muted border border-border',
                  isFuture && 'bg-muted/50 border border-border/50 opacity-40',
                  isToday && !d.done && 'neon-pulse border-primary'
                )}
              >
                {d.done ? <Check className="w-4 h-4" /> : new Date(d.date + 'T12:00:00').getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Check in button */}
      <Button onClick={goals.toggleGymDay} className="w-full mb-3 bg-success/10 text-success border border-success/30 hover:bg-success/20">
        <Check className="w-4 h-4 mr-2" /> {weekStatus.find(d => d.date === todayStr)?.done ? 'Desmarcar Hoje' : '✓ FUI HOJE'}
      </Button>

      <div className="text-center text-sm font-mono">
        <span className="text-success font-bold">{weekCount}</span>
        <span className="text-muted-foreground"> / {goals.gym.weeklyGoalDays} dias esta semana</span>
      </div>

      {/* Last 4 weeks */}
      <div className="mt-4 pt-3 border-t border-border">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Últimas 4 semanas</span>
        <div className="flex gap-2 mt-2">
          {last4.map((w, i) => (
            <div key={i} className="flex-1 text-center">
              <div className="text-xs font-mono font-bold text-foreground">{w.count}</div>
              <div className="text-[9px] text-muted-foreground">dias</div>
            </div>
          ))}
        </div>
      </div>

      {weekCount >= goals.gym.weeklyGoalDays && (
        <div className="mt-3 text-center text-xs text-success font-bold animate-pulse">
          🏆 Meta de academia atingida!
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-sm">Meta de Academia (dias/semana)</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} min={1} max={7} className="bg-muted" />
            <Button onClick={() => { goals.setGymGoal(Number(goalInput) || 5); setSettingsOpen(false); }}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Money Card ----
function MoneyCard({ goals }: { goals: ReturnType<typeof useGoals> }) {
  const [amount, setAmount] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [goalInput, setGoalInput] = useState(String(goals.money.monthlyGoal));

  const total = goals.getMoneyMonthTotal();
  const entries = goals.getMoneyMonthEntries();
  const pct = Math.min((total / goals.money.monthlyGoal) * 100, 100);
  const remaining = Math.max(goals.money.monthlyGoal - total, 0);

  // Donut chart
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="neon-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5 text-coin" />
          <h3 className="font-display text-sm font-bold tracking-wide">💰 Poupança</h3>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="text-muted-foreground hover:text-foreground">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Donut */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(240 20% 12%)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={radius} fill="none"
              stroke={pct >= 100 ? 'hsl(152 100% 50%)' : 'hsl(190 100% 50%)'}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono font-bold text-lg text-foreground">{Math.round(pct)}%</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-muted-foreground mb-1">Guardado este mês</div>
          <div className="font-mono font-bold text-xl text-foreground">
            R$ {total.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Meta: R$ {goals.money.monthlyGoal.toFixed(2)}
          </div>
          {remaining > 0 && (
            <div className="text-xs text-primary mt-1">
              Faltam R$ {remaining.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Add entry */}
      <div className="flex gap-2 mb-4">
        <Input
          type="number"
          placeholder="Valor (R$)"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="bg-muted"
        />
        <Button
          onClick={() => {
            const val = parseFloat(amount);
            if (val > 0) { goals.addMoneyEntry(val); setAmount(''); }
          }}
          className="shrink-0 bg-coin/10 text-coin border border-coin/30 hover:bg-coin/20"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>

      {/* History */}
      {entries.length > 0 && (
        <div className="max-h-32 overflow-y-auto no-scrollbar space-y-1">
          {entries.slice().reverse().map(e => (
            <div key={e.id} className="flex justify-between text-xs py-1 px-2 rounded bg-muted/50">
              <span className="text-muted-foreground">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              <span className="font-mono text-success font-bold">+ R$ {e.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {pct >= 100 && (
        <div className="mt-3 text-center text-xs text-success font-bold animate-pulse">
          🏆 Meta financeira atingida!
        </div>
      )}

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="font-display text-sm">Meta de Poupança (R$/mês)</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2">
            <Input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} className="bg-muted" />
            <Button onClick={() => { goals.setMoneyGoal(Number(goalInput) || 500); setSettingsOpen(false); }}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---- Insights Panel ----
function InsightsPanel({ goals }: { goals: ReturnType<typeof useGoals> }) {
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    setInsights(goals.getInsights());
  }, [goals]);

  return (
    <div className="neon-card-static bg-secondary/5 border border-secondary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary" />
          <h3 className="font-display text-sm font-bold tracking-wide text-secondary">💡 Insights</h3>
        </div>
        <button
          onClick={() => setInsights(goals.getInsights())}
          className="text-muted-foreground hover:text-secondary transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="text-xs text-foreground/80 leading-relaxed py-2 px-3 rounded-lg bg-muted/30 border border-border/50">
            {insight}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function GoalsPage() {
  const goals = useGoals();

  return (
    <div className="px-4 pt-4 pb-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Crosshair className="w-6 h-6 text-primary" />
        <h1 className="font-display text-xl font-bold tracking-wider text-foreground">Metas</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main goals - 2 cols on lg */}
        <div className="lg:col-span-2 space-y-4">
          <StudyCard goals={goals} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GymCard goals={goals} />
            <MoneyCard goals={goals} />
          </div>
        </div>

        {/* Insights sidebar */}
        <div className="lg:col-span-1">
          <InsightsPanel goals={goals} />
        </div>
      </div>
    </div>
  );
}
