import { useState } from 'react';
import { CalendarDays, Plus, Sparkles, Target, Flame, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '@/contexts/GameContext';
import { MissionCard } from '@/components/MissionCard';
import { ProgressCard } from '@/components/ProgressCard';
import { LevelUpModal } from '@/components/LevelUpModal';
import { CreateMissionModal } from '@/components/CreateMissionModal';
import { PenaltyAlert } from '@/components/PenaltyAlert';
import { AchievementUnlockModal } from '@/components/AchievementUnlockModal';
import { useAchievements } from '@/hooks/useAchievements';
import { toast } from 'sonner';

const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function Dashboard() {
  const { todayMissions, completeMission, stats, hasActiveBoost, streaks, recentPenalties, dismissPenalties } = useGame();
  const { newlyUnlocked, dismissNewBadges } = useAchievements();
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const today = new Date();
  const dayName = DAY_NAMES_FULL[today.getDay()];
  const dateStr = today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  const hasXpBoost = hasActiveBoost('boost_xp');
  const hasGolden = hasActiveBoost('golden_mission');

  // Best streak across all missions
  const bestStreak = streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0);

  const handleComplete = async (missionId: string) => {
    const result = await completeMission(missionId);
    if (result) {
      toast.success(`+${result.expGained} EXP | +${result.coinsGained} moedas`, {
        icon: <Sparkles className="w-4 h-4 text-primary" />,
      });
      if (result.levelUp) {
        setTimeout(() => setLevelUpLevel(result.newLevel), 500);
      }
    }
  };

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 py-6 space-y-6">
        {/* Date Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{dayName}</h1>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4" />
              {dateStr}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Active Boosts Banner */}
        {(hasXpBoost || hasGolden) && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {hasGolden ? 'Missão Dourada ativa — 3x recompensas!' : 'Boost XP ativo — 2x EXP!'}
            </span>
          </div>
        )}

        {/* Penalty Alert */}
        {recentPenalties.length > 0 && (
          <PenaltyAlert penalties={recentPenalties} onDismiss={dismissPenalties} />
        )}

        {/* Streak Summary */}
        {bestStreak > 0 && (
          <div className="bg-card rounded-xl p-4 shadow-soft flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-streak/15 flex items-center justify-center">
              <Flame className="w-5 h-5 text-streak animate-fire-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Melhor streak ativo: <span className="font-mono text-streak">{bestStreak} dias</span>
              </p>
              <p className="text-xs text-muted-foreground">Continue completando para manter!</p>
            </div>
          </div>
        )}

        {/* Today's Missions */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Missões do Dia</h2>
            <span className="ml-auto text-sm text-muted-foreground font-mono">
              {todayMissions.length}
            </span>
          </div>

          {todayMissions.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center shadow-soft">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">Nenhuma missão para hoje</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie novas missões ou aguarde o próximo dia válido
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Missão
              </button>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {todayMissions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  onComplete={() => handleComplete(mission.id)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Progress */}
        <section>
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-exp" />
            Progresso
          </h2>
          <ProgressCard />
        </section>
      </main>

      {levelUpLevel && (
        <LevelUpModal level={levelUpLevel} onClose={() => setLevelUpLevel(null)} />
      )}
      {showCreateModal && (
        <CreateMissionModal onClose={() => setShowCreateModal(false)} />
      )}
      {newlyUnlocked.length > 0 && (
        <AchievementUnlockModal badges={newlyUnlocked} onClose={dismissNewBadges} />
      )}
    </div>
  );
}
