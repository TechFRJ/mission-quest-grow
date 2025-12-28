import { useState, useRef } from 'react';
import { User, Sparkles, Coins, Target, Trophy, Calendar, History, Gift, Camera, LogOut } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getMissions } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function Profile() {
  const { stats } = useGame();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const missions = getMissions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const progressPercent = Math.min((stats.currentExp / stats.expToNext) * 100, 100);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl + '?t=' + Date.now());

      // Update profile with avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      toast({ title: 'Foto atualizada com sucesso!' });
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar foto', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Aventureiro';

  return (
    <div className="min-h-screen pb-safe">
      <main className="container px-4 py-6 space-y-6">
        {/* Profile Header */}
        <div className="bg-card rounded-xl p-6 shadow-soft text-center">
          <div 
            className="relative w-20 h-20 mx-auto mb-4 cursor-pointer group"
            onClick={handleAvatarClick}
          >
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full object-cover"
              />
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
                <div className="w-6 h-6 border-2 border-background border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <h1 className="text-xl font-bold text-foreground mb-1">{userName}</h1>
          <p className="text-sm text-muted-foreground mb-2">{user?.email}</p>
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

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
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
