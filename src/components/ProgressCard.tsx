import { useGame } from '@/contexts/GameContext';
import { Target, Calendar, CalendarDays, Trophy } from 'lucide-react';

export function ProgressCard() {
  const { stats } = useGame();
  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  return (
    <div className="bg-card rounded-xl p-5 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Nível</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-mono text-foreground">{stats.level}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">EXP</span>
          <div className="text-base font-bold font-mono text-exp">
            {stats.currentExp} / {stats.expToNext}
          </div>
        </div>
      </div>

      <div className="progress-bar mb-6">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <StatItem icon={Target} label="Hoje" value={stats.completionsToday} />
        <StatItem icon={Calendar} label="Semana" value={stats.completionsWeek} />
        <StatItem icon={CalendarDays} label="Mês" value={stats.completionsMonth} />
        <StatItem icon={Trophy} label="Total" value={stats.totalCompletions} />
      </div>
    </div>
  );
}

function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-1">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="font-bold font-mono text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
