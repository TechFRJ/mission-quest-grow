import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, Pause, Square, RotateCcw, Brain, Code2, Globe2,
  Languages, BookOpen, Crosshair, Flame, Clock, TrendingUp,
  CheckCircle2, X,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

// ---------- APEX blocks (Fase 1) ----------
type BlockType = 'faculdade' | 'python' | 'web' | 'ingles' | 'leitura' | 'livre';

const APEX_BLOCKS: {
  type: BlockType;
  label: string;
  desc: string;
  minutes: number;
  icon: any;
  hue: string;
}[] = [
  { type: 'faculdade', label: 'Faculdade Anhanguera', desc: 'Bloco 1 · Engenharia de Software',     minutes: 90, icon: Brain,     hue: '262 83% 65%' },
  { type: 'python',    label: 'Python + Algoritmos',  desc: 'Bloco 2 · Alura + Livro · 2h',          minutes: 120, icon: Code2,    hue: '142 71% 50%' },
  { type: 'web',       label: 'Desenvolvimento Web',  desc: 'Bloco 3 · B7Web · HTML/CSS/JS',         minutes: 90, icon: Globe2,    hue: '199 89% 55%' },
  { type: 'ingles',    label: 'Inglês (Imersão)',     desc: 'Bloco 4 · 30 min diários',              minutes: 30, icon: Languages, hue: '38 92% 55%'  },
  { type: 'leitura',   label: 'Leitura Estratégica',  desc: 'Bloco 5 · 20 min antes de dormir',      minutes: 20, icon: BookOpen,  hue: '340 82% 60%' },
  { type: 'livre',     label: 'Foco Livre',           desc: 'Sessão customizada',                    minutes: 25, icon: Crosshair, hue: '0 0% 70%'    },
];

const BLOCK_BY_TYPE = Object.fromEntries(APEX_BLOCKS.map(b => [b.type, b])) as Record<BlockType, typeof APEX_BLOCKS[number]>;

const formatHMS = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const formatHours = (s: number) => `${(s / 3600).toFixed(1)}h`;

export default function FocusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ---- Active session state (in-memory) ----
  const [activeBlock, setActiveBlock] = useState<BlockType | null>(null);
  const [customMinutes, setCustomMinutes] = useState(25);
  const [targetSec, setTargetSec] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [notionUrl, setNotionUrl] = useState('');
  const intervalRef = useRef<number | null>(null);

  // Ticker
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setElapsedSec(s => {
        const next = s + 1;
        if (next >= targetSec && targetSec > 0) {
          setRunning(false);
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
          toast.success('Sessão completa! Salve e ganhe XP.');
          return targetSec;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, targetSec]);

  const startBlock = (type: BlockType, overrideMin?: number) => {
    const block = BLOCK_BY_TYPE[type];
    const mins = overrideMin ?? block.minutes;
    setActiveBlock(type);
    setTargetSec(mins * 60);
    setElapsedSec(0);
    setStartedAt(new Date());
    setRunning(true);
    setNotes('');
    setNotionUrl('');
  };

  const togglePause = () => setRunning(r => !r);

  const reset = () => {
    setRunning(false);
    setElapsedSec(0);
    setStartedAt(new Date());
  };

  const abandon = () => {
    setActiveBlock(null);
    setRunning(false);
    setElapsedSec(0);
    setStartedAt(null);
    setTargetSec(0);
    setNotes('');
    setNotionUrl('');
  };

  const saveSession = async () => {
    if (!user || !activeBlock || elapsedSec < 30) {
      toast.error('Sessão muito curta para registrar (mín. 30s).');
      return;
    }
    const block = BLOCK_BY_TYPE[activeBlock];
    const completed = elapsedSec >= targetSec;
    const { error } = await supabase.from('focus_sessions').insert({
      user_id: user.id,
      block_type: activeBlock,
      block_label: block.label,
      target_seconds: targetSec,
      duration_seconds: elapsedSec,
      started_at: (startedAt ?? new Date()).toISOString(),
      ended_at: new Date().toISOString(),
      completed,
      notes: notes || null,
      notion_note_url: notionUrl || null,
    });
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success(`+${Math.round(elapsedSec / 60)}min registrados em ${block.label}`);
    qc.invalidateQueries({ queryKey: ['focus_sessions'] });
    abandon();
  };

  // ---- History query ----
  const { data: sessions = [] } = useQuery({
    queryKey: ['focus_sessions', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // ---- Stats ----
  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);

    let today = 0, week = 0, weekCount = 0;
    const perBlock: Record<string, number> = {};
    const last7: number[] = Array(7).fill(0);

    for (const s of sessions) {
      const d = new Date(s.started_at);
      if (d >= startOfDay) today += s.duration_seconds;
      if (d >= startOfWeek) { week += s.duration_seconds; weekCount++; }
      perBlock[s.block_type] = (perBlock[s.block_type] ?? 0) + s.duration_seconds;
      const dayDiff = Math.floor((startOfDay.getTime() - new Date(d).setHours(0,0,0,0)) / 86400000);
      if (dayDiff >= 0 && dayDiff < 7) last7[6 - dayDiff] += s.duration_seconds;
    }

    // streak: consecutive days with any focus session
    let streak = 0;
    const days = new Set(sessions.map(s => new Date(s.started_at).toDateString()));
    const cur = new Date(); cur.setHours(0,0,0,0);
    while (days.has(cur.toDateString())) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    return { today, week, weekCount, perBlock, last7, streak };
  }, [sessions]);

  const progress = targetSec > 0 ? (elapsedSec / targetSec) * 100 : 0;
  const activeMeta = activeBlock ? BLOCK_BY_TYPE[activeBlock] : null;

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 md:px-6 py-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-end justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-mono">Protocolo APEX</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Foco Profundo</h1>
            <p className="text-sm text-muted-foreground mt-1">Sem celular. Sem notificação. Só execução.</p>
          </div>
          {stats.streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--streak)/0.1)] border border-[hsl(var(--streak)/0.2)]">
              <Flame className="w-4 h-4 text-[hsl(var(--streak))]" />
              <span className="font-mono font-bold text-sm text-[hsl(var(--streak))]">{stats.streak}d</span>
            </div>
          )}
        </header>

        {/* ACTIVE SESSION ----------------------------------------- */}
        {activeBlock && activeMeta && (
          <section
            className="relative rounded-2xl border border-primary/30 bg-card overflow-hidden"
            style={{ boxShadow: `0 0 80px -20px hsl(${activeMeta.hue} / 0.4)` }}
          >
            {/* glow bg */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 0%, hsl(${activeMeta.hue} / 0.3), transparent 70%)`,
              }}
            />

            <div className="relative p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `hsl(${activeMeta.hue} / 0.15)`, color: `hsl(${activeMeta.hue})` }}
                  >
                    <activeMeta.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">Sessão ativa</p>
                    <h2 className="text-base md:text-lg font-semibold truncate">{activeMeta.label}</h2>
                  </div>
                </div>
                <button
                  onClick={abandon}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                  title="Descartar sessão"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Timer */}
              <div className="flex flex-col items-center py-4">
                <div
                  className="text-6xl md:text-7xl font-mono font-bold tracking-tighter tabular-nums"
                  style={{ color: `hsl(${activeMeta.hue})`, textShadow: `0 0 40px hsl(${activeMeta.hue} / 0.5)` }}
                >
                  {formatHMS(Math.max(targetSec - elapsedSec, 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-mono">
                  {formatHMS(elapsedSec)} / {formatHMS(targetSec)} · {Math.round(progress)}%
                </p>

                {/* progress ring/bar */}
                <div className="w-full max-w-md mt-5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(progress, 100)}%`,
                      background: `linear-gradient(90deg, hsl(${activeMeta.hue}), hsl(${activeMeta.hue} / 0.6))`,
                      boxShadow: `0 0 12px hsl(${activeMeta.hue} / 0.6)`,
                    }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={reset}
                  className="w-11 h-11 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-center transition"
                  title="Reiniciar"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePause}
                  className="h-12 px-8 rounded-xl font-semibold text-sm flex items-center gap-2 transition active:scale-95"
                  style={{
                    background: `hsl(${activeMeta.hue})`,
                    color: '#000',
                    boxShadow: `0 0 30px hsl(${activeMeta.hue} / 0.5)`,
                  }}
                >
                  {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Continuar</>}
                </button>
                <button
                  onClick={saveSession}
                  disabled={elapsedSec < 30}
                  className="w-11 h-11 rounded-xl border border-success/40 text-success hover:bg-success/10 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Salvar sessão"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              </div>

              {/* Notion-style notes */}
              <div className="space-y-2 pt-4 border-t border-border/60">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Nota do estudo (regra APEX nº 2)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="O que aprendeu (suas palavras), código que VOCÊ escreveu, 1 dúvida que ficou..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50"
                />
                <input
                  value={notionUrl}
                  onChange={e => setNotionUrl(e.target.value)}
                  placeholder="Link da nota no Notion (opcional)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </section>
        )}

        {/* BLOCK PICKER ----------------------------------------- */}
        {!activeBlock && (
          <>
            {/* Stats strip */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile icon={Clock}      label="Hoje"            value={formatHours(stats.today)}      hue="262 83% 65%" />
              <StatTile icon={TrendingUp} label="Esta semana"     value={formatHours(stats.week)}       hue="199 89% 55%" />
              <StatTile icon={CheckCircle2} label="Sessões/semana" value={String(stats.weekCount)}      hue="142 71% 50%" />
              <StatTile icon={Flame}      label="Streak de foco"  value={stats.streak ? `${stats.streak}d` : '—'} hue="38 92% 55%" />
            </section>

            {/* Last 7 days chart */}
            <section className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Últimos 7 dias</h3>
                <span className="text-[11px] text-muted-foreground font-mono">
                  total {formatHours(stats.last7.reduce((a, b) => a + b, 0))}
                </span>
              </div>
              <div className="flex items-end gap-2 h-24">
                {stats.last7.map((sec, i) => {
                  const max = Math.max(...stats.last7, 3600);
                  const pct = (sec / max) * 100;
                  const dayLabel = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
                  const today = new Date();
                  const d = new Date(today); d.setDate(today.getDate() - (6 - i));
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full flex-1 flex items-end">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary transition-all"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                          title={`${formatHours(sec)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{dayLabel[d.getDay()]}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* APEX Blocks */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold">Blocos APEX · Fase 1</h2>
                  <p className="text-xs text-muted-foreground">Iniciar sessão com duração pré-definida do protocolo</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {APEX_BLOCKS.map(b => {
                  const doneToday = stats.perBlock[b.type] ?? 0;
                  return (
                    <button
                      key={b.type}
                      onClick={() => startBlock(b.type, b.type === 'livre' ? customMinutes : undefined)}
                      className="group text-left bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition relative overflow-hidden"
                    >
                      <div
                        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 group-hover:opacity-20 transition"
                        style={{ background: `hsl(${b.hue})` }}
                      />
                      <div className="relative flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `hsl(${b.hue} / 0.15)`, color: `hsl(${b.hue})` }}
                        >
                          <b.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold text-sm">{b.label}</h3>
                            <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                              {b.minutes}min
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                          {doneToday > 0 && (
                            <p className="text-[10px] text-success font-mono mt-2">
                              ✓ {formatHours(doneToday)} esta semana
                            </p>
                          )}
                          {b.type === 'livre' && (
                            <div className="mt-2 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <input
                                type="number"
                                min={5} max={180}
                                value={customMinutes}
                                onChange={e => setCustomMinutes(Math.max(5, Math.min(180, +e.target.value || 25)))}
                                className="w-16 bg-background border border-border rounded px-2 py-1 text-xs font-mono"
                              />
                              <span className="text-[10px] text-muted-foreground">min</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* History */}
            {sessions.length > 0 && (
              <section>
                <h2 className="text-base font-semibold mb-3">Histórico recente</h2>
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                  {sessions.slice(0, 8).map(s => {
                    const meta = BLOCK_BY_TYPE[s.block_type as BlockType] ?? BLOCK_BY_TYPE.livre;
                    const d = new Date(s.started_at);
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `hsl(${meta.hue} / 0.15)`, color: `hsl(${meta.hue})` }}
                        >
                          <meta.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.block_label ?? meta.label}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={cn('text-sm font-mono font-bold', s.completed ? 'text-success' : 'text-muted-foreground')}>
                            {formatHMS(s.duration_seconds)}
                          </p>
                          {s.completed && <p className="text-[10px] text-success">completa</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hue }: { icon: any; label: string; value: string; hue: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
        style={{ background: `hsl(${hue} / 0.12)`, color: `hsl(${hue})` }}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold font-mono tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
