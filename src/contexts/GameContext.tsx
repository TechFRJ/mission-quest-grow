import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { categoryToAttribute } from '@/lib/attributes';

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

export interface MissionStreak {
  missionId: string;
  currentStreak: number;
  maxStreak: number;
  lastCompletedAt: string | null;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  type: string;
  durationHours: number | null;
}

export interface ActiveItem {
  id: string;
  itemType: string;
  activatedAt: string;
  expiresAt: string | null;
  missionId: string | null;
  used: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'boost_xp', name: 'Boost XP 2x', description: 'Dobra o EXP por 24h', cost: 100, icon: 'Zap', type: 'boost_xp', durationHours: 24 },
  { id: 'day_off', name: 'Dia Livre', description: 'Sem penalidades por 24h', cost: 80, icon: 'Coffee', type: 'day_off', durationHours: 24 },
  { id: 'streak_reset', name: 'Reset Streak', description: 'Restaura um streak perdido', cost: 150, icon: 'RotateCcw', type: 'streak_reset', durationHours: null },
  { id: 'golden_mission', name: 'Missão Dourada', description: '3x recompensas na próxima missão', cost: 200, icon: 'Star', type: 'golden_mission', durationHours: null },
];

export interface PenaltyInfo {
  missionTitle: string;
  coinsLost: number;
  xpLost: number;
  reason: string;
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
  globalStreak: number;
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
  streaks: MissionStreak[];
  activeItems: ActiveItem[];
  recentPenalties: PenaltyInfo[];
  dismissPenalties: () => void;
  addMission: (mission: Omit<Mission, 'id' | 'createdAt'>) => Promise<void>;
  updateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  deleteMission: (id: string) => Promise<void>;
  completeMission: (missionId: string) => Promise<CompletionResult | null>;
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => Promise<void>;
  deleteReward: (id: string) => Promise<void>;
  purchaseReward: (rewardId: string) => Promise<boolean>;
  purchaseShopItem: (itemType: string, missionId?: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
  hasActiveBoost: (type: string) => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

function expForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateLevel(totalExp: number): { level: number; currentExp: number; expToNext: number } {
  let level = 1;
  let expRemaining = totalExp;
  while (expRemaining >= expForLevel(level)) {
    expRemaining -= expForLevel(level);
    level++;
  }
  return { level, currentExp: expRemaining, expToNext: expForLevel(level) };
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
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
  level: 1, currentExp: 0, expToNext: 100, totalExp: 0, coins: 0,
  completionsToday: 0, completionsWeek: 0, completionsMonth: 0,
  totalCompletions: 0, recentCompletions: [], purchases: [], globalStreak: 0,
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
  const [streaks, setStreaks] = useState<MissionStreak[]>([]);
  const [activeItems, setActiveItems] = useState<ActiveItem[]>([]);
  const [recentPenalties, setRecentPenalties] = useState<PenaltyInfo[]>([]);

  const dismissPenalties = useCallback(() => setRecentPenalties([]), []);
  const hasActiveBoost = useCallback((type: string): boolean => {
    const now = new Date();
    return activeItems.some(item =>
      item.itemType === type && !item.used &&
      (!item.expiresAt || new Date(item.expiresAt) > now)
    );
  }, [activeItems]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setMissions([]); setRewards([]); setTodayMissions([]);
      setStats(defaultStats); setStreaks([]); setActiveItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [missionsRes, rewardsRes, completionsRes, purchasesRes, profileRes, streaksRes, itemsRes] = await Promise.all([
        supabase.from('missions').select('*').eq('user_id', user.id),
        supabase.from('rewards').select('*').eq('user_id', user.id),
        supabase.from('completions').select('*').eq('user_id', user.id),
        supabase.from('purchases').select('*, rewards(name, cost)').eq('user_id', user.id),
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('mission_streaks' as any).select('*').eq('user_id', user.id),
        supabase.from('active_items' as any).select('*').eq('user_id', user.id),
      ]);

      const missionsData: Mission[] = (missionsRes.data || []).map((m: any) => ({
        id: m.id, title: m.title, category: m.category,
        type: m.type as 'normal' | 'daily', validDays: m.valid_days || [],
        xp: m.xp, coins: m.coins, active: m.active, createdAt: m.created_at,
      }));
      setMissions(missionsData);

      const rewardsData: Reward[] = (rewardsRes.data || []).map((r: any) => ({
        id: r.id, name: r.name, cost: r.cost, createdAt: r.created_at,
      }));
      setRewards(rewardsData);

      const completionsData = completionsRes.data || [];
      setCompletions(completionsData);

      const streaksData: MissionStreak[] = ((streaksRes.data as any[]) || []).map((s: any) => ({
        missionId: s.mission_id,
        currentStreak: s.current_streak,
        maxStreak: s.max_streak,
        lastCompletedAt: s.last_completed_at,
      }));
      setStreaks(streaksData);

      const now = new Date();
      const activeItemsData: ActiveItem[] = ((itemsRes.data as any[]) || []).filter((i: any) =>
        !i.used && (!i.expires_at || new Date(i.expires_at) > now)
      ).map((i: any) => ({
        id: i.id, itemType: i.item_type, activatedAt: i.activated_at,
        expiresAt: i.expires_at, missionId: i.mission_id, used: i.used,
      }));
      setActiveItems(activeItemsData);

      const purchasesData = purchasesRes.data || [];

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

      const profile = profileRes.data;
      if (profile) {
        const { level, currentExp, expToNext } = calculateLevel(profile.xp);
        setStats({
          level, currentExp, expToNext,
          totalExp: profile.xp, coins: profile.coins,
          completionsToday: completionsData.filter((c: any) => isToday(c.completed_at)).length,
          completionsWeek: completionsData.filter((c: any) => isThisWeek(c.completed_at)).length,
          completionsMonth: completionsData.filter((c: any) => isThisMonth(c.completed_at)).length,
          totalCompletions: completionsData.length,
          recentCompletions: completionsData.slice(-10).reverse(),
          purchases: purchasesData.slice(-10).reverse(),
          globalStreak: profile.streak || 0,
        });
      }

      // === PENALTY SYSTEM ===
      // Check for daily missions that were valid yesterday but not completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayDow = yesterday.getDay();

      // Check if we already applied penalties for yesterday
      const { data: existingPenalties } = await supabase
        .from('penalties' as any)
        .select('mission_id')
        .eq('user_id', user.id)
        .eq('penalty_date', yesterdayStr);

      const alreadyPenalized = new Set((existingPenalties as any[] || []).map((p: any) => p.mission_id));

      // Check if day_off was active yesterday
      const hadDayOff = ((itemsRes.data as any[]) || []).some((i: any) =>
        i.item_type === 'day_off' && !i.used &&
        new Date(i.activated_at) <= yesterday &&
        (!i.expires_at || new Date(i.expires_at) > yesterday)
      );

      if (!hadDayOff && profile) {
        const missedMissions = missionsData.filter(m =>
          m.active && m.type === 'daily' &&
          m.validDays.includes(yesterdayDow) &&
          !alreadyPenalized.has(m.id) &&
          !completionsData.some((c: any) => c.mission_id === m.id && c.completed_at === yesterdayStr)
        );

        if (missedMissions.length > 0) {
          const newPenalties: PenaltyInfo[] = [];
          let totalCoinsLost = 0;
          let totalXpLost = 0;

          for (const mission of missedMissions) {
            // Find streak for this mission
            const streak = streaksData.find(s => s.missionId === mission.id);
            const hadStreak = streak && streak.currentStreak > 0 && streak.lastCompletedAt !== yesterdayStr;

            let coinsLost = 5; // -5 coins per missed mission
            let xpLost = 0;
            let reason = 'missed_daily';

            // Check consecutive failures (3+ = -15 XP)
            // A broken streak of 3+ means 3 consecutive completions lost
            if (hadStreak && streak!.currentStreak >= 3) {
              xpLost = 15;
              reason = 'streak_broken_3plus';
            }

            newPenalties.push({
              missionTitle: mission.title,
              coinsLost: coinsLost,
              xpLost: xpLost,
              reason: reason,
            });

            totalCoinsLost += coinsLost;
            totalXpLost += xpLost;

            // Record penalty
            await (supabase.from('penalties' as any) as any).insert({
              user_id: user.id,
              mission_id: mission.id,
              penalty_date: yesterdayStr,
              coins_lost: coinsLost,
              xp_lost: xpLost,
              reason: reason,
            });

            // Reset streak if broken
            if (hadStreak) {
              await (supabase.from('mission_streaks' as any) as any).update({
                current_streak: 0,
              }).eq('user_id', user.id).eq('mission_id', mission.id);
            }
          }

          // Apply penalties to profile
          const newCoins = Math.max(0, profile.coins - totalCoinsLost);
          const newXp = Math.max(0, profile.xp - totalXpLost);
          const { level: newLevel, currentExp, expToNext } = calculateLevel(newXp);

          await supabase.from('profiles').update({
            coins: newCoins, xp: newXp, level: newLevel,
          }).eq('user_id', user.id);

          // Update local stats
          setStats(prev => ({
            ...prev,
            coins: newCoins,
            totalExp: newXp,
            level: newLevel,
            currentExp,
            expToNext,
          }));

          setRecentPenalties(newPenalties);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const addMission = useCallback(async (mission: Omit<Mission, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('missions').insert({
      user_id: user.id, title: mission.title, category: mission.category,
      type: mission.type, valid_days: mission.validDays, xp: mission.xp,
      coins: mission.coins, active: mission.active,
    });
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar a missão.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Missão criada!' });
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
    const { error } = await supabase.from('missions').update(updateData).eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível atualizar.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Missão atualizada!' });
    await refreshData();
  }, [user, refreshData, toast]);

  const deleteMission = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('missions').delete().eq('id', id).eq('user_id', user.id);
    await refreshData();
  }, [user, refreshData]);

  const completeMission = useCallback(async (missionId: string): Promise<CompletionResult | null> => {
    if (!user) return null;
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return null;

    const todayStr = getTodayString();
    const yesterdayStr = getYesterdayString();

    if (mission.type === 'normal' && completions.some((c: any) => c.mission_id === missionId)) return null;
    if (mission.type === 'daily' && completions.some((c: any) => c.mission_id === missionId && c.completed_at === todayStr)) return null;

    const { error: completionError } = await supabase.from('completions').insert({
      user_id: user.id, mission_id: missionId, completed_at: todayStr,
    });
    if (completionError) return null;

    // Update streak for daily missions
    if (mission.type === 'daily') {
      const existingStreak = streaks.find(s => s.missionId === missionId);
      let newCurrent = 1;
      let newMax = 1;

      if (existingStreak) {
        if (existingStreak.lastCompletedAt === yesterdayStr) {
          newCurrent = existingStreak.currentStreak + 1;
        } else if (existingStreak.lastCompletedAt === todayStr) {
          newCurrent = existingStreak.currentStreak;
        } else {
          newCurrent = 1; // Streak broken
        }
        newMax = Math.max(existingStreak.maxStreak, newCurrent);

        await (supabase.from('mission_streaks' as any) as any).update({
          current_streak: newCurrent, max_streak: newMax, last_completed_at: todayStr,
        }).eq('user_id', user.id).eq('mission_id', missionId);
      } else {
        await (supabase.from('mission_streaks' as any) as any).insert({
          user_id: user.id, mission_id: missionId,
          current_streak: 1, max_streak: 1, last_completed_at: todayStr,
        });
      }
    }

    // Check for active boosts
    const hasXpBoost = activeItems.some(i => i.itemType === 'boost_xp' && !i.used && (!i.expiresAt || new Date(i.expiresAt) > new Date()));
    const hasGolden = activeItems.some(i => i.itemType === 'golden_mission' && !i.used);

    let xpMultiplier = 1;
    let coinMultiplier = 1;
    if (hasGolden) {
      xpMultiplier = 3; coinMultiplier = 3;
      // Mark golden mission as used
      const goldenItem = activeItems.find(i => i.itemType === 'golden_mission' && !i.used);
      if (goldenItem) {
        await (supabase.from('active_items' as any) as any).update({ used: true }).eq('id', goldenItem.id);
      }
    } else if (hasXpBoost) {
      xpMultiplier = 2;
    }

    const expGained = mission.xp * xpMultiplier;
    const coinsGained = mission.coins * coinMultiplier;
    const newTotalExp = stats.totalExp + expGained;
    const newCoins = stats.coins + coinsGained;
    const { level: newLevel } = calculateLevel(newTotalExp);

    await supabase.from('profiles').update({
      xp: newTotalExp, coins: newCoins, level: newLevel,
    }).eq('user_id', user.id);

    // Log attribute XP
    const attribute = categoryToAttribute(mission.category);
    await (supabase.from('attribute_logs' as any) as any).insert({
      user_id: user.id,
      attribute,
      xp_gained: expGained,
      source_mission_id: missionId,
      logged_at: getTodayString(),
    });

    await refreshData();

    return { levelUp: newLevel > stats.level, newLevel, expGained, coinsGained };
  }, [user, missions, completions, stats, streaks, activeItems, refreshData]);

  const addReward = useCallback(async (reward: Omit<Reward, 'id' | 'createdAt'>) => {
    if (!user) return;
    const { error } = await supabase.from('rewards').insert({
      user_id: user.id, name: reward.name, cost: reward.cost,
    });
    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível salvar.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Recompensa criada!' });
    await refreshData();
  }, [user, refreshData, toast]);

  const deleteReward = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from('rewards').delete().eq('id', id).eq('user_id', user.id);
    await refreshData();
  }, [user, refreshData]);

  const purchaseReward = useCallback(async (rewardId: string): Promise<boolean> => {
    if (!user) return false;
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || stats.coins < reward.cost) {
      toast({ title: 'Moedas insuficientes', variant: 'destructive' });
      return false;
    }
    const { error: purchaseError } = await supabase.from('purchases').insert({
      user_id: user.id, reward_id: rewardId,
    });
    if (purchaseError) return false;
    await supabase.from('profiles').update({ coins: stats.coins - reward.cost }).eq('user_id', user.id);
    toast({ title: `${reward.name} resgatada! 🎁` });
    await refreshData();
    return true;
  }, [user, rewards, stats, refreshData, toast]);

  const purchaseShopItem = useCallback(async (itemType: string, missionId?: string): Promise<boolean> => {
    if (!user) return false;
    const item = SHOP_ITEMS.find(i => i.type === itemType);
    if (!item) return false;

    if (stats.coins < item.cost) {
      toast({ title: 'Moedas insuficientes', description: `Você precisa de ${item.cost} moedas.`, variant: 'destructive' });
      return false;
    }

    // Anti-abuse: check if already has active item of same type (for timed items)
    if (item.durationHours && hasActiveBoost(itemType)) {
      toast({ title: 'Item já ativo', description: 'Aguarde o item atual expirar.', variant: 'destructive' });
      return false;
    }

    const expiresAt = item.durationHours
      ? new Date(Date.now() + item.durationHours * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await (supabase.from('active_items' as any) as any).insert({
      user_id: user.id,
      item_type: itemType,
      expires_at: expiresAt,
      mission_id: missionId || null,
      used: false,
    });

    if (error) {
      toast({ title: 'Erro ao comprar item', variant: 'destructive' });
      return false;
    }

    await supabase.from('profiles').update({ coins: stats.coins - item.cost }).eq('user_id', user.id);
    toast({ title: `${item.name} ativado!`, description: item.description });
    await refreshData();
    return true;
  }, [user, stats, hasActiveBoost, refreshData, toast]);

  return (
    <GameContext.Provider value={{
      missions, rewards, todayMissions, stats, loading, streaks, activeItems,
      recentPenalties, dismissPenalties,
      addMission, updateMission, deleteMission, completeMission,
      addReward, deleteReward, purchaseReward, purchaseShopItem,
      refreshData, hasActiveBoost,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
