import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StartWorkoutTab from '@/components/workouts/StartWorkoutTab';
import WorkoutHistoryTab from '@/components/workouts/WorkoutHistoryTab';
import { Dumbbell, Flame, Zap, CalendarCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export default function WorkoutsPage() {
  const { user } = useAuth();

  const { data: weekStats } = useQuery({
    queryKey: ['workout-week-stats', user?.id],
    queryFn: async () => {
      if (!user) return { count: 0, streak: 0, xp: 0 };
      const now = new Date();
      const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

      const { count } = await supabase
        .from('workouts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', weekStart)
        .lte('date', weekEnd);

      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      let streak = 0;
      if (recentWorkouts?.length) {
        const uniqueDates = [...new Set(recentWorkouts.map(w => w.date))].sort().reverse();
        const today = format(now, 'yyyy-MM-dd');
        const yesterday = format(new Date(now.getTime() - 86400000), 'yyyy-MM-dd');

        if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1]);
            const curr = new Date(uniqueDates[i]);
            const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
            if (diffDays === 1) streak++;
            else break;
          }
        }
      }

      const xp = (count || 0) * 25;
      return { count: count || 0, streak, xp };
    },
    enabled: !!user,
  });

  const stats = weekStats || { count: 0, streak: 0, xp: 0 };

  return (
    <div className="min-h-screen bg-background px-4 md:px-6 pt-6 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[hsl(var(--success))]/12 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-[hsl(var(--success))]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Treinos</h1>
            <p className="text-xs text-muted-foreground">Registre e acompanhe seus treinos</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <CalendarCheck className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
            <p className="text-base font-bold text-foreground font-mono">{stats.count}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Esta semana</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Flame className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--streak))]" />
            <p className="text-base font-bold text-foreground font-mono">{stats.streak} 🔥</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Streak</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-center">
            <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-primary" />
            <p className="text-base font-bold text-foreground font-mono">{stats.xp}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">XP Semana</p>
          </div>
        </div>

        <Tabs defaultValue="start" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl">
            <TabsTrigger value="start" className="rounded-lg font-semibold text-xs">Iniciar Treino</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg font-semibold text-xs">Histórico</TabsTrigger>
          </TabsList>
          <TabsContent value="start"><StartWorkoutTab /></TabsContent>
          <TabsContent value="history"><WorkoutHistoryTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
