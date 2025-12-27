import { User, Sparkles, Coins, Target, Trophy, Calendar, History, Gift } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { getMissions } from '@/lib/storage';

export function Profile() {
  const { stats } = useGame();
  const missions = getMissions();

  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl p-6 shadow-soft text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">Aventureiro</h1>
          <div className="stat-badge level mx-auto">
            <Sparkles className="w-4 h-4" />
            <span>Nível {stats.level}</span>
          </div>
        </div>

        {/* EXP Progress */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Experiência</span>
            <span className="text-sm font-bold text-exp">
              {stats.currentExp} / {stats.expToNext} EXP
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {stats.expToNext - stats.currentExp} EXP para o próximo nível
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Sparkles}
            label="EXP Total"
            value={stats.totalExp.toLocaleString()}
            color="exp"
          />
          <StatCard
            icon={Coins}
            label="Moedas"
            value={stats.coins.toLocaleString()}
            color="coin"
          />
          <StatCard
            icon={Target}
            label="Missões"
            value={missions.length.toString()}
            color="primary"
          />
          <StatCard
            icon={Trophy}
            label="Concluídas"
            value={stats.totalCompletions.toString()}
            color="success"
          />
        </div>

        {/* Completion Stats */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-accent" />
            Resumo de Atividade
          </h2>
          <div className="space-y-3">
            <ActivityRow label="Hoje" value={stats.completionsToday} />
            <ActivityRow label="Esta semana" value={stats.completionsWeek} />
            <ActivityRow label="Este mês" value={stats.completionsMonth} />
          </div>
        </div>

        {/* Recent Activity */}
        {stats.recentCompletions.length > 0 && (
          <div className="bg-card rounded-xl p-5 shadow-soft">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-muted-foreground" />
              Histórico Recente
            </h2>
            <div className="space-y-2">
              {stats.recentCompletions.slice(0, 5).map((completion, index) => {
                const mission = missions.find(m => m.id === completion.missionId);
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {mission?.title || 'Missão removida'}
                      </p>
                      <p className="text-xs text-muted-foreground">{completion.date}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-exp">+{completion.exp} EXP</span>
                      {completion.coins > 0 && (
                        <span className="text-xs text-coin ml-2">+{completion.coins} 🪙</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Purchase History */}
        {stats.purchases.length > 0 && (
          <div className="bg-card rounded-xl p-5 shadow-soft">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              Recompensas Resgatadas
            </h2>
            <div className="space-y-2">
              {stats.purchases.slice(0, 5).map((purchase, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{purchase.rewardName}</p>
                    <p className="text-xs text-muted-foreground">{purchase.date}</p>
                  </div>
                  <span className="text-sm text-coin font-medium">-{purchase.cost} 🪙</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: any;
  label: string;
  value: string;
  color: 'exp' | 'coin' | 'primary' | 'success';
}) {
  const colorClasses = {
    exp: 'text-exp bg-exp/10',
    coin: 'text-coin bg-coin/10',
    primary: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
  };

  return (
    <div className="bg-card rounded-xl p-4 shadow-soft">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value} missões</span>
    </div>
  );
}
