import { useState } from 'react';
import { CalendarDays, Plus, Sparkles, Target, Flame, Zap, TrendingUp, Trophy, ArrowUpRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '@/contexts/GameContext';
import { MissionCard } from '@/components/MissionCard';
import { LevelUpModal } from '@/components/LevelUpModal';
import { CreateMissionModal } from '@/components/CreateMissionModal';
import { PenaltyAlert } from '@/components/PenaltyAlert';
import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { useAchievements } from '@/hooks/useAchievements';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function Dashboard() {
  const { todayMissions, completeMission, stats, hasActiveBoost, streaks, recentPenalties, dismissPenalties, missions } = useGame();
  const { newlyUnlocked, dismissNewBadges } = useAchievements();
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const today = new Date();
  const dayName = DAY_NAMES_FULL[today.getDay()];
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  const hasXpBoost = hasActiveBoost('boost_xp');
  const hasGolden = hasActiveBoost('golden_mission');
  const bestStreak = streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0);
  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  const handleComplete = async (missionId: string) => {
    const result = await completeMission(missionId);
    if (result) {
      confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 }, colors: ['#7c5cf2', '#f59e0b', '#22c55e'] });
      toast.success(`+${result.expGained} XP · +${result.coinsGained} moedas`);
      if (result.levelUp) {
        setTimeout(() => {
          setLevelUpLevel(result.newLevel);
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 md:px-6 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{dayName}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <CalendarDays className="w-3.5 h-3.5" />
              {dateStr}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Active Boosts */}
        {(hasXpBoost || hasGolden) && (
          <div className="bg-primary/8 border border-primary/15 rounded-xl p-3 flex items-center gap-3">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {hasGolden ? 'Missão Dourada ativa — 3x recompensas' : 'Boost XP ativo — 2x EXP'}
            </span>
          </div>
        )}

        {/* Penalties */}
        {recentPenalties.length > 0 && (
          <PenaltyAlert penalties={recentPenalties} onDismiss={dismissPenalties} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Nível" value={stats.level} icon={Sparkles} color="primary" />
          <StatCard label="XP Total" value={stats.totalExp.toLocaleString()} icon={TrendingUp} color="exp" />
          <StatCard label="Streak" value={bestStreak > 0 ? `${bestStreak}d` : '—'} icon={Flame} color="streak" />
          <StatCard label="Concluídas" value={stats.totalCompletions} icon={Trophy} color="success" />
        </div>

        {/* XP Progress */}
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">Progresso para Nível {stats.level + 1}</span>
            <span className="text-xs font-mono font-bold text-primary">
              {stats.currentExp} / {stats.expToNext} XP
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-muted-foreground">
              {stats.expToNext - stats.currentExp} XP restantes
            </span>
            <span className="text-[11px] text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Hoje" value={stats.completionsToday} />
          <MiniStat label="Semana" value={stats.completionsWeek} />
          <MiniStat label="Mês" value={stats.completionsMonth} />
        </div>

        {/* Today's Missions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Missões do Dia</h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">{todayMissions.length} pendentes</span>
          </div>

          {todayMissions.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Nenhuma missão para hoje</h3>
              <p className="text-xs text-muted-foreground mb-4">Crie novas missões ou aguarde o próximo dia válido</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Missão
              </button>
            </div>
          ) : (
            <div className="space-y-2 stagger-children">
              {todayMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} onComplete={() => handleComplete(mission.id)} />
              ))}
            </div>
          )}
        </section>
      </main>

      {levelUpLevel && <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />}
      {showCreateModal && <CreateMissionModal onClose={() => setShowCreateModal(false)} />}
      {newlyUnlocked.length > 0 && <AchievementUnlockModal badges={newlyUnlocked} onClose={dismissNewBadges} />}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10',
    exp: 'text-[hsl(var(--exp))] bg-[hsl(var(--exp)/0.1)]',
    streak: 'text-[hsl(var(--streak))] bg-[hsl(var(--streak)/0.1)]',
    success: 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)]',
  };

  return (
    <div className="bg-card rounded-xl p-3.5 border border-border group hover:border-primary/20 transition-colors">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2.5', colorMap[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-bold font-mono text-foreground tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border text-center">
      <p className="text-lg font-bold font-mono text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </div>
  );
}
