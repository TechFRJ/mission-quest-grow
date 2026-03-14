import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/contexts/GameContext';
import { BADGES, BadgeDefinition } from '@/lib/badges';

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const { stats, dataVersion } = useGame();
  const [unlocked, setUnlocked] = useState<UnlockedBadge[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnlocked = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('achievements' as any)
      .select('badge_id, unlocked_at')
      .eq('user_id', user.id);
    
    setUnlocked(((data as any[]) || []).map((a: any) => ({
      badgeId: a.badge_id,
      unlockedAt: a.unlocked_at,
    })));
    setLoading(false);
  }, [user]);

  const checkAndUnlock = useCallback(async () => {
    if (!user) return;

    // Fetch completion data for checks
    const [completionsRes, streaksRes] = await Promise.all([
      supabase.from('completions').select('mission_id, completed_at').eq('user_id', user.id),
      supabase.from('mission_streaks' as any).select('*').eq('user_id', user.id),
    ]);

    const completions = completionsRes.data || [];
    const streaksData = (streaksRes.data as any[]) || [];
    const totalCompletions = completions.length;
    const bestStreak = streaksData.reduce((max: number, s: any) => Math.max(max, s.max_streak || 0), 0);
    const totalXp = stats.totalExp;
    const level = stats.level;

    // Count completions per category by joining with missions
    const { data: missionsData } = await supabase
      .from('missions')
      .select('id, category')
      .eq('user_id', user.id);
    
    const missionMap = new Map((missionsData || []).map((m: any) => [m.id, m.category]));
    const categoryCounts: Record<string, number> = {};
    completions.forEach((c: any) => {
      const cat = missionMap.get(c.mission_id);
      if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const maxCategoryCount = Math.max(0, ...Object.values(categoryCounts));
    const uniqueCategories = Object.keys(categoryCounts).length;

    // Determine which badges should be unlocked
    const shouldUnlock: string[] = [];
    const checks: Record<string, boolean> = {
      first_mission: totalCompletions >= 1,
      missions_10: totalCompletions >= 10,
      missions_50: totalCompletions >= 50,
      missions_100: totalCompletions >= 100,
      missions_500: totalCompletions >= 500,
      streak_3: bestStreak >= 3,
      streak_7: bestStreak >= 7,
      streak_14: bestStreak >= 14,
      streak_30: bestStreak >= 30,
      xp_500: totalXp >= 500,
      xp_2000: totalXp >= 2000,
      xp_5000: totalXp >= 5000,
      xp_10000: totalXp >= 10000,
      category_10: maxCategoryCount >= 10,
      all_categories: uniqueCategories >= 5,
      level_5: level >= 5,
      level_10: level >= 10,
    };

    const alreadyUnlocked = new Set(unlocked.map(u => u.badgeId));

    for (const [badgeId, condition] of Object.entries(checks)) {
      if (condition && !alreadyUnlocked.has(badgeId)) {
        shouldUnlock.push(badgeId);
      }
    }

    if (shouldUnlock.length > 0) {
      const inserts = shouldUnlock.map(badgeId => ({
        user_id: user.id,
        badge_id: badgeId,
      }));

      await (supabase.from('achievements' as any) as any).insert(inserts);

      const newBadges = shouldUnlock
        .map(id => BADGES.find(b => b.id === id))
        .filter(Boolean) as BadgeDefinition[];
      
      setNewlyUnlocked(newBadges);
      await fetchUnlocked();
    }
  }, [user, stats, unlocked, fetchUnlocked]);

  useEffect(() => { fetchUnlocked(); }, [fetchUnlocked]);

  // Check for new achievements whenever data changes
  useEffect(() => {
    if (!loading && user && dataVersion > 0) {
      checkAndUnlock();
    }
  }, [dataVersion, loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissNewBadges = useCallback(() => setNewlyUnlocked([]), []);

  return {
    unlocked,
    newlyUnlocked,
    dismissNewBadges,
    loading,
    allBadges: BADGES,
  };
}
