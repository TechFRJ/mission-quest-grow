import { useGame } from '@/contexts/GameContext';
import { Target, Calendar, CalendarDays, Trophy } from 'lucide-react';

export function ProgressCard() {
  const { stats } = useGame();
  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nível</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono text-foreground">{stats.level}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">XP</span>
          <div className="text-sm font-bold font-mono text-primary">
            {stats.currentExp} / {stats.expToNext}
          </div>
        </div>
      </div>

      <div className="progress-bar mb-5">
        <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="grid grid-cols-4 gap-2">
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
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mx-auto mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="font-bold font-mono text-foreground text-sm">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
