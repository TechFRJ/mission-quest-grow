import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Mission {
  id: string;
  title: string;
  category: string;
  type: 'normal' | 'daily';
  validDays: number[];
  xp: number;
  coins: number;
  active: boolean;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  createdAt: string;
}

interface Stats {
  level: number;
  currentExp: number;
  expToNext: number;
  totalExp: number;
  coins: number;
  completionsToday: number;
  completionsWeek: number;
  completionsMonth: number;
  totalCompletions: number;
  recentCompletions: any[];
  purchases: any[];
}

interface CompletionResult {
  levelUp: boolean;
  newLevel: number;
  expGained: number;
  coinsGained: number;
}

interface GameContextType {
  missions: Mission[];
  rewards: Reward[];
  todayMissions: Mission[];
  stats: Stats;
  loading: boolean;
  addMission: (mission: Omit<Mission, 'id' | 'createdAt'>) => Promise<void>;
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  completeMission: (missionId: string) => Promise<CompletionResult | null>;
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  purchaseReward: (rewardId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const GameContext = createContext<GameContextType | null>(null);

// Calculate EXP needed for a given level
function expForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from total EXP
function calculateLevel(totalExp: number): { level: number; currentExp: number; expToNext: number } {
  let level = 1;
  let expRemaining = totalExp;
  
  while (expRemaining >= expForLevel(level)) {
    expRemaining -= expForLevel(level);
    level++;
  }
  
  return {
    level,
    currentExp: expRemaining,
    expToNext: expForLevel(level),
  };
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

const defaultStats: Stats = {
  level: 1,
  currentExp: 0,
  expToNext: 100,
  totalExp: 0,
  coins: 0,
  completionsToday: 0,
  completionsWeek: 0,
  completionsMonth: 0,
  totalCompletions: 0,
  recentCompletions: [],
  purchases: [],
};

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [todayMissions, setTodayMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [completions, setCompletions] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setMissions([]);
      setRewards([]);
      setTodayMissions([]);
      setStats(defaultStats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [missionsRes, rewardsRes, completionsRes, purchasesRes, profileRes] = await Promise.all([
        supabase.from('missions').select('*').eq('user_id', user.id),
        supabase.from('rewards').select('*').eq('user_id', user.id),
        supabase.from('completions').select('*').eq('user_id', user.id),
        supabase.from('purchases').select('*, rewards(name, cost)').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
      ]);

      // Process missions
      const missionsData: Mission[] = (missionsRes.data || []).map((m) => ({
        id: m.id,
        title: m.title,
        category: m.category,
        type: m.type as 'normal' | 'daily',
        validDays: m.valid_days || [],
        xp: m.xp,
        coins: m.coins,
        active: m.active,
        createdAt: m.created_at,
      }));
      setMissions(missionsData);

      // Process rewards
      const rewardsData: Reward[] = (rewardsRes.data || []).map((r) => ({
        id: r.id,
        name: r.name,
        cost: r.cost,
        createdAt: r.created_at,
      }));
      setRewards(rewardsData);

      // Store completions
      const completionsData = completionsRes.data || [];
      setCompletions(completionsData);

      // Store purchases
      const purchasesData = purchasesRes.data || [];
      setPurchases(purchasesData);

      // Calculate today's missions
      const today = getTodayDayOfWeek();
      const todayStr = getTodayString();
      
      const todayMissionsData = missionsData.filter(mission => {
        if (!mission.active) return false;
        
        if (mission.type === 'normal') {
          return !completionsData.some((c: any) => c.mission_id === mission.id);
        }
        
        if (mission.type === 'daily') {
          const validToday = mission.validDays.includes(today);
          const completedToday = completionsData.some(
            (c: any) => c.mission_id === mission.id && c.completed_at === todayStr
          );
          return validToday && !completedToday;
        }
        
        return false;
      });
      setTodayMissions(todayMissionsData);

      // Calculate stats from profile
      const profile = profileRes.data;
      if (profile) {
        const { level, currentExp, expToNext } = calculateLevel(profile.xp);
        
        setStats({
          level,
          currentExp,
          expToNext,
          totalExp: profile.xp,
          coins: profile.coins,
          completionsToday: completionsData.filter((c: any) => isToday(c.completed_at)).length,
          completionsWeek: completionsData.filter((c: any) => isThisWeek(c.completed_at)).length,
          completionsMonth: completionsData.filter((c: any) => isThisMonth(c.completed_at)).length,
          totalCompletions: completionsData.length,
          recentCompletions: completionsData.slice(-10).reverse(),
          purchases: purchasesData.slice(-10).reverse(),
        });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addMission = useCallback(async (mission: Omit<Mission, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { error } = await supabase.from('missions').insert({
      user_id: user.id,
      title: mission.title,
      category: mission.category,
      type: mission.type,
      valid_days: mission.validDays,
      xp: mission.xp,
      coins: mission.coins,
      active: mission.active,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a missão.',
        variant: 'destructive',
      });
      console.error('Error adding mission:', error);
      return;
    }

    toast({
      title: 'Sucesso!',
      description: 'Missão salva com sucesso.',
    });
    
    await refreshData();
  }, [user, refreshData, toast]);

  const updateMission = useCallback(async (id: string, updates: Partial<Mission>) => {
    if (!user) return;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.validDays !== undefined) updateData.valid_days = updates.validDays;
    if (updates.xp !== undefined) updateData.xp = updates.xp;
    if (updates.coins !== undefined) updateData.coins = updates.coins;
    if (updates.active !== undefined) updateData.active = updates.active;

    const { error } = await supabase
      .from('missions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a missão.',
        variant: 'destructive',
      });
      console.error('Error updating mission:', error);
      return;
    }

    toast({
      title: 'Sucesso!',
      description: 'Missão atualizada com sucesso.',
    });
    
    await refreshData();
  }, [user, refreshData, toast]);

  const deleteMission = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('missions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting mission:', error);
      return;
    }
    
    await refreshData();
  }, [user, refreshData]);

  const completeMission = useCallback(async (missionId: string): Promise<CompletionResult | null> => {
    if (!user) return null;

    const mission = missions.find(m => m.id === missionId);
    if (!mission) return null;

    const todayStr = getTodayString();

    // Check if already completed
    if (mission.type === 'normal') {
      if (completions.some((c: any) => c.mission_id === missionId)) {
        return null;
      }
    } else if (mission.type === 'daily') {
      if (completions.some((c: any) => c.mission_id === missionId && c.completed_at === todayStr)) {
        return null;
      }
    }

    // Add completion
    const { error: completionError } = await supabase.from('completions').insert({
      user_id: user.id,
      mission_id: missionId,
      completed_at: todayStr,
    });

    if (completionError) {
      console.error('Error completing mission:', completionError);
      return null;
    }

    // Update profile
    const newTotalExp = stats.totalExp + mission.xp;
    const newCoins = stats.coins + mission.coins;
    const { level: newLevel } = calculateLevel(newTotalExp);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        xp: newTotalExp,
        coins: newCoins,
        level: newLevel,
      })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    await refreshData();

    return {
      levelUp: newLevel > stats.level,
      newLevel,
      expGained: mission.xp,
      coinsGained: mission.coins,
    };
  }, [user, missions, completions, stats, refreshData]);

  const addReward = useCallback(async (reward: Omit<Reward, 'id' | 'createdAt'>) => {
    if (!user) return;

    const { error } = await supabase.from('rewards').insert({
      user_id: user.id,
      name: reward.name,
      cost: reward.cost,
    });

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a recompensa.',
        variant: 'destructive',
      });
      console.error('Error adding reward:', error);
      return;
    }

    toast({
      title: 'Sucesso!',
      description: 'Recompensa salva com sucesso.',
    });
    
    await refreshData();
  }, [user, refreshData, toast]);

  const deleteReward = useCallback(async (id: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting reward:', error);
      return;
    }
    
    await refreshData();
  }, [user, refreshData]);

  const purchaseReward = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!user) return false;

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return false;

    if (stats.coins < reward.cost) {
      toast({
        title: 'Moedas insuficientes',
        description: `Você precisa de ${reward.cost} moedas.`,
        variant: 'destructive',
      });
      return false;
    }

    // Add purchase
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: user.id,
      reward_id: rewardId,
    });

    if (purchaseError) {
      console.error('Error purchasing reward:', purchaseError);
      return false;
    }

    // Update coins
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ coins: stats.coins - reward.cost })
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating coins:', profileError);
    }

    toast({
      title: 'Recompensa resgatada!',
      description: `Você resgatou: ${reward.name}`,
    });

    await refreshData();
    return true;
  }, [user, rewards, stats, refreshData, toast]);

  return (
    <GameContext.Provider
      value={{
        missions,
        rewards,
        todayMissions,
        stats,
        loading,
        addMission,
        updateMission,
        deleteMission,
        completeMission,
        addReward,
        deleteReward,
        purchaseReward,
        refreshData,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Export for compatibility
export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
