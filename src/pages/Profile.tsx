import { useState, useRef, useEffect } from 'react';
import {
  User, Sparkles, Coins, Target, Trophy, Calendar, History, Gift,
  Camera, LogOut, Flame, Edit3, Save, Github, Linkedin, Loader2, BarChart3,
} from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { useAttributes } from '@/hooks/useAttributes';
import { useAchievements } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AttributeRadarChart } from '@/components/AttributeRadarChart';
import { BadgeGrid } from '@/components/BadgeGrid';
import { ATTRIBUTES } from '@/lib/attributes';
import { cn } from '@/lib/utils';

export function Profile() {
  const { stats, missions, streaks } = useGame();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { currentMonth, previousMonth, currentWeek, loading: attrLoading } = useAttributes();
  const { unlocked, loading: badgesLoading } = useAchievements();
  const bestStreak = streaks.reduce((max, s) => Math.max(max, s.maxStreak), 0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [monthlyGoal, setMonthlyGoal] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [chartView, setChartView] = useState<'month' | 'week'>('month');

  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url, bio, monthly_goal, github_url, linkedin_url')
      .eq('user_id', user.id).single().then(({ data }) => {
        if (data) {
          setAvatarUrl(data.avatar_url);
          setBio((data as any).bio || '');
          setMonthlyGoal((data as any).monthly_goal || '');
          setGithubUrl((data as any).github_url || '');
          setLinkedinUrl((data as any).linkedin_url || '');
        }
      });
  }, [user]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl + '?t=' + Date.now());
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('user_id', user.id);
      toast({ title: 'Foto atualizada!' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar foto', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await supabase.from('profiles').update({
        bio, monthly_goal: monthlyGoal, github_url: githubUrl, linkedin_url: linkedinUrl,
      } as any).eq('user_id', user.id);
      toast({ title: 'Perfil atualizado!' });
      setEditingBio(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Aventureiro';

  // Max attribute value for chart scale
  const allValues = Object.values(currentMonth);
  const maxAttr = Math.max(100, ...allValues, ...Object.values(previousMonth));

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 py-6 space-y-5">
        {/* Profile Header Card */}
        <div className="bg-card rounded-xl p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div
              className="relative w-20 h-20 flex-shrink-0 cursor-pointer group"
              onClick={handleAvatarClick}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-background" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-foreground/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-background animate-spin" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{userName}</h1>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="stat-badge level text-xs">
                  <Sparkles className="w-3 h-3" /> Nv. {stats.level}
                </div>
                {bestStreak > 0 && (
                  <div className="stat-badge streak text-xs">
                    <Flame className="w-3 h-3" /> {bestStreak}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setEditingBio(!editingBio)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Bio & Goals */}
          {editingBio ? (
            <div className="mt-4 space-y-3 animate-fade-in-up">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
                <Input value={bio} onChange={e => setBio(e.target.value)} placeholder="Futuro Dev | Foco total" maxLength={120} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Meta do mês</label>
                <Input value={monthlyGoal} onChange={e => setMonthlyGoal(e.target.value)} placeholder="Ex: 30 dias de código" maxLength={100} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</label>
                  <Input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="username" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</label>
                  <Input value={linkedinUrl} onChange={e => setLinkedinUrl(e.target.value)} placeholder="username" />
                </div>
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="w-full">
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Perfil
              </Button>
            </div>
          ) : (
            <div className="mt-3 space-y-1">
              {bio && <p className="text-sm text-muted-foreground">{bio}</p>}
              {monthlyGoal && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="w-3 h-3 text-primary" /> Meta: {monthlyGoal}
                </p>
              )}
              <div className="flex items-center gap-3">
                {githubUrl && (
                  <a href={`https://github.com/${githubUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {linkedinUrl && (
                  <a href={`https://linkedin.com/in/${linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* EXP Progress */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Experiência</span>
            <span className="text-sm font-bold font-mono text-exp">
              {stats.currentExp} / {stats.expToNext}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {stats.expToNext - stats.currentExp} EXP para o próximo nível
          </p>
        </div>

        {/* Radar Chart - Attributes */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-exp" />
              Atributos
            </h2>
            <div className="flex bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setChartView('month')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  chartView === 'month' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Mensal
              </button>
              <button
                onClick={() => setChartView('week')}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  chartView === 'week' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                )}
              >
                Semanal
              </button>
            </div>
          </div>

          {attrLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <AttributeRadarChart
              current={chartView === 'month' ? currentMonth : currentWeek}
              previous={chartView === 'month' ? previousMonth : undefined}
              maxValue={Math.max(100, maxAttr)}
            />
          )}

          {/* Attribute breakdown */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {ATTRIBUTES.map(attr => {
              const val = chartView === 'month' ? (currentMonth[attr.key] || 0) : (currentWeek[attr.key] || 0);
              return (
                <div key={attr.key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                  <span className="text-base">{attr.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{attr.label}</p>
                    <p className="text-xs font-mono text-exp">{val} XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <MiniStat icon={Sparkles} value={stats.totalExp} label="EXP Total" />
          <MiniStat icon={Coins} value={stats.coins} label="Moedas" />
          <MiniStat icon={Trophy} value={stats.totalCompletions} label="Concluídas" />
          <MiniStat icon={Target} value={missions.length} label="Missões" />
          <MiniStat icon={Flame} value={bestStreak} label="Melhor Streak" />
          <MiniStat icon={Calendar} value={stats.completionsMonth} label="Este Mês" />
        </div>

        {/* Activity Summary */}
        <div className="bg-card rounded-xl p-5 shadow-soft">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Atividade
          </h2>
          <div className="space-y-2">
            <ActivityRow label="Hoje" value={stats.completionsToday} />
            <ActivityRow label="Esta semana" value={stats.completionsWeek} />
            <ActivityRow label="Este mês" value={stats.completionsMonth} />
          </div>
        </div>

        {/* Recent History */}
        {stats.recentCompletions.length > 0 && (
          <div className="bg-card rounded-xl p-5 shadow-soft">
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
              <History className="w-4 h-4 text-muted-foreground" />
              Histórico Recente
            </h2>
            <div className="space-y-2">
              {stats.recentCompletions.slice(0, 5).map((completion: any, index: number) => {
                const mission = missions.find(m => m.id === completion.mission_id);
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {mission?.title || 'Missão removida'}
                    </p>
                    <span className="text-xs text-muted-foreground font-mono">{completion.completed_at}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sign Out */}
        <Button variant="outline" className="w-full" onClick={() => signOut()}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </main>
    </div>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="bg-card rounded-xl p-3 shadow-soft text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-lg font-bold font-mono text-foreground">{value.toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-sm">{value}</span>
    </div>
  );
}
