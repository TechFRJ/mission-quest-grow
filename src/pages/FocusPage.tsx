import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play, Pause, Square, RotateCcw, Brain, Code2, Globe2,
  Languages, BookOpen, Crosshair, Flame, Clock, TrendingUp,
  CheckCircle2, X, FileDown, PlusCircle,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const STORAGE_KEY = 'apex_focus_session_v1';

type PersistedSession = {
  blockType: BlockType;
  targetSec: number;
  startEpoch: number;          // ms — when timer originally started
  pausedSince: number | null;  // ms — null if running
  accumulatedPausedMs: number; // total paused time
  notes: string;
  notionUrl: string;
};

const formatHMS = (s: number) => {
  s = Math.max(0, Math.floor(s));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const formatHours = (s: number) => `${(s / 3600).toFixed(1)}h`;

const computeElapsed = (s: PersistedSession): number => {
  const now = Date.now();
  const paused = s.accumulatedPausedMs + (s.pausedSince ? now - s.pausedSince : 0);
  return Math.max(0, Math.floor((now - s.startEpoch - paused) / 1000));
};

export default function FocusPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  // ---- Persistent session state ----
  const [session, setSession] = useState<PersistedSession | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PersistedSession) : null;
    } catch { return null; }
  });
  const [elapsedSec, setElapsedSec] = useState(() => (session ? computeElapsed(session) : 0));
  const [customMinutes, setCustomMinutes] = useState(25);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualBlock, setManualBlock] = useState<BlockType>('faculdade');
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [manualMinutes, setManualMinutes] = useState(60);
  const [manualNotes, setManualNotes] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualSaving, setManualSaving] = useState(false);
  const completedFiredRef = useRef(false);

  // Persist on every session change
  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  // Ticker — recomputes from epoch so it survives reload / leaving the app
  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const e = computeElapsed(session);
      setElapsedSec(e);
      if (e >= session.targetSec && !completedFiredRef.current && !session.pausedSince) {
        completedFiredRef.current = true;
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 } });
        toast.success('Sessão completa! Salve e ganhe XP.');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible' && session) {
        setElapsedSec(computeElapsed(session));
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [session]);

  const startBlock = (type: BlockType, overrideMin?: number) => {
    const block = BLOCK_BY_TYPE[type];
    const mins = overrideMin ?? block.minutes;
    completedFiredRef.current = false;
    setSession({
      blockType: type,
      targetSec: mins * 60,
      startEpoch: Date.now(),
      pausedSince: null,
      accumulatedPausedMs: 0,
      notes: '',
      notionUrl: '',
    });
  };

  const togglePause = () => {
    setSession(s => {
      if (!s) return s;
      if (s.pausedSince) {
        // resume
        return { ...s, accumulatedPausedMs: s.accumulatedPausedMs + (Date.now() - s.pausedSince), pausedSince: null };
      }
      return { ...s, pausedSince: Date.now() };
    });
  };

  const reset = () => {
    completedFiredRef.current = false;
    setSession(s => s ? { ...s, startEpoch: Date.now(), pausedSince: null, accumulatedPausedMs: 0 } : s);
    setElapsedSec(0);
  };

  const abandon = () => {
    completedFiredRef.current = false;
    setSession(null);
    setElapsedSec(0);
  };

  const updateNotes = (notes: string) => setSession(s => s ? { ...s, notes } : s);
  const updateNotionUrl = (notionUrl: string) => setSession(s => s ? { ...s, notionUrl } : s);

  const saveSession = async () => {
    if (!user || !session || elapsedSec < 30) {
      toast.error('Sessão muito curta para registrar (mín. 30s).');
      return;
    }
    const block = BLOCK_BY_TYPE[session.blockType];
    const completed = elapsedSec >= session.targetSec;
    const { error } = await supabase.from('focus_sessions').insert({
      user_id: user.id,
      block_type: session.blockType,
      block_label: block.label,
      target_seconds: session.targetSec,
      duration_seconds: elapsedSec,
      started_at: new Date(session.startEpoch).toISOString(),
      ended_at: new Date().toISOString(),
      completed,
      notes: session.notes || null,
      notion_note_url: session.notionUrl || null,
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
      since.setDate(since.getDate() - 90);
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

    let streak = 0;
    const days = new Set(sessions.map(s => new Date(s.started_at).toDateString()));
    const cur = new Date(); cur.setHours(0,0,0,0);
    while (days.has(cur.toDateString())) {
      streak++;
      cur.setDate(cur.getDate() - 1);
    }

    return { today, week, weekCount, perBlock, last7, streak };
  }, [sessions]);

  // ---- PDF report ----
  const generatePDF = useCallback(() => {
    if (sessions.length === 0) {
      toast.error('Sem sessões registradas ainda.');
      return;
    }
    const doc = new jsPDF();
    const now = new Date();

    // Header
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(167, 139, 250);
    doc.setFontSize(10);
    doc.text('PROTOCOLO APEX', 14, 12);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Relatório de Foco Profundo', 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 200);
    doc.text(`Gerado em ${now.toLocaleString('pt-BR')}`, 14, 28);

    // Summary
    const total = sessions.reduce((a, s) => a + s.duration_seconds, 0);
    const completedCount = sessions.filter(s => s.completed).length;
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(12);
    doc.text('Resumo', 14, 44);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const summary = [
      `Total estudado: ${formatHours(total)} (${sessions.length} sessões)`,
      `Sessões completas: ${completedCount}`,
      `Hoje: ${formatHours(stats.today)}  ·  Esta semana: ${formatHours(stats.week)}`,
      `Streak atual: ${stats.streak} dia(s)`,
    ];
    summary.forEach((t, i) => doc.text(t, 14, 52 + i * 6));

    // Per-block breakdown
    autoTable(doc, {
      startY: 82,
      head: [['Matéria / Bloco', 'Sessões', 'Horas']],
      body: APEX_BLOCKS.map(b => {
        const blockSessions = sessions.filter(s => s.block_type === b.type);
        const totalSec = blockSessions.reduce((a, s) => a + s.duration_seconds, 0);
        return [b.label, String(blockSessions.length), formatHours(totalSec)];
      }).filter(r => r[1] !== '0'),
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 10 },
    });

    // Sessions table
    const afterY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text('Histórico de Sessões', 14, afterY);

    autoTable(doc, {
      startY: afterY + 4,
      head: [['Data', 'Matéria', 'Duração', 'Status', 'Notas']],
      body: sessions.map(s => {
        const d = new Date(s.started_at);
        const meta = BLOCK_BY_TYPE[s.block_type as BlockType] ?? BLOCK_BY_TYPE.livre;
        return [
          d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }),
          meta.label,
          formatHMS(s.duration_seconds),
          s.completed ? 'Completa' : 'Parcial',
          (s.notes || '') + (s.notion_note_url ? `\n${s.notion_note_url}` : ''),
        ];
      }),
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2, valign: 'top' },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 42 },
        2: { cellWidth: 20 },
        3: { cellWidth: 18 },
        4: { cellWidth: 'auto' },
      },
      didDrawPage: (data) => {
        const pageStr = `Página ${doc.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        doc.text(pageStr, 200, 290, { align: 'right' });
      },
    });

    const fname = `apex-relatorio-${now.toISOString().slice(0, 10)}.pdf`;
    doc.save(fname);
    toast.success('Relatório gerado.');
  }, [sessions, stats]);

  const targetSec = session?.targetSec ?? 0;
  const progress = targetSec > 0 ? (elapsedSec / targetSec) * 100 : 0;
  const activeMeta = session ? BLOCK_BY_TYPE[session.blockType] : null;
  const isRunning = session && !session.pausedSince;

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 md:px-6 py-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <header className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-mono">Protocolo APEX</p>
            <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">Foco Profundo</h1>
            <p className="text-sm text-muted-foreground mt-1">Sem celular. Sem notificação. Só execução.</p>
          </div>
          <div className="flex items-center gap-2">
            {stats.streak > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--streak)/0.1)] border border-[hsl(var(--streak)/0.2)]">
                <Flame className="w-4 h-4 text-[hsl(var(--streak))]" />
                <span className="font-mono font-bold text-sm text-[hsl(var(--streak))]">{stats.streak}d</span>
              </div>
            )}
            <button
              onClick={generatePDF}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition text-xs font-mono uppercase tracking-wider"
              title="Gerar relatório PDF"
            >
              <FileDown className="w-4 h-4" />
              Relatório PDF
            </button>
          </div>
        </header>

        {/* ACTIVE SESSION ----------------------------------------- */}
        {session && activeMeta && (
          <section
            className="relative rounded-2xl border border-primary/30 bg-card overflow-hidden"
            style={{ boxShadow: `0 0 80px -20px hsl(${activeMeta.hue} / 0.4)` }}
          >
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ background: `radial-gradient(circle at 50% 0%, hsl(${activeMeta.hue} / 0.3), transparent 70%)` }}
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
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-mono">
                      Sessão ativa {!isRunning && '· pausada'}
                    </p>
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
                  {isRunning ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Continuar</>}
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

              <div className="space-y-2 pt-4 border-t border-border/60">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  Nota do estudo (regra APEX nº 2)
                </label>
                <textarea
                  value={session.notes}
                  onChange={e => updateNotes(e.target.value)}
                  placeholder="O que aprendeu (suas palavras), código que VOCÊ escreveu, 1 dúvida que ficou..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50"
                />
                <input
                  value={session.notionUrl}
                  onChange={e => updateNotionUrl(e.target.value)}
                  placeholder="Link da nota no Notion (opcional)"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
          </section>
        )}

        {/* BLOCK PICKER ----------------------------------------- */}
        {!session && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile icon={Clock}        label="Hoje"            value={formatHours(stats.today)} hue="262 83% 65%" />
              <StatTile icon={TrendingUp}   label="Esta semana"     value={formatHours(stats.week)}  hue="199 89% 55%" />
              <StatTile icon={CheckCircle2} label="Sessões/semana"  value={String(stats.weekCount)}  hue="142 71% 50%" />
              <StatTile icon={Flame}        label="Streak de foco"  value={stats.streak ? `${stats.streak}d` : '—'} hue="38 92% 55%" />
            </section>

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
