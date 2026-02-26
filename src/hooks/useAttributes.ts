import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ATTRIBUTES, AttributeKey } from '@/lib/attributes';

interface AttributeScores {
  [key: string]: number;
}

export function useAttributes() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<AttributeScores>({});
  const [previousMonth, setPreviousMonth] = useState<AttributeScores>({});
  const [currentWeek, setCurrentWeek] = useState<AttributeScores>({});
  const [loading, setLoading] = useState(true);

  const fetchAttributes = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const now = new Date();
      
      // Current month start
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      // Previous month
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      
      // Current week start (Monday)
      const weekStart = new Date(now);
      const dayOfWeek = weekStart.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - diff);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const [currentRes, prevRes, weekRes] = await Promise.all([
        supabase.from('attribute_logs' as any).select('attribute, xp_gained')
          .eq('user_id', user.id).gte('logged_at', monthStart),
        supabase.from('attribute_logs' as any).select('attribute, xp_gained')
          .eq('user_id', user.id).gte('logged_at', prevMonthStart).lte('logged_at', prevMonthEnd),
        supabase.from('attribute_logs' as any).select('attribute, xp_gained')
          .eq('user_id', user.id).gte('logged_at', weekStartStr),
      ]);

      const aggregate = (data: any[]): AttributeScores => {
        const scores: AttributeScores = {};
        ATTRIBUTES.forEach(a => scores[a.key] = 0);
        (data || []).forEach((row: any) => {
          if (scores[row.attribute] !== undefined) {
            scores[row.attribute] += row.xp_gained;
          }
        });
        return scores;
      };

      setCurrentMonth(aggregate(currentRes.data as any[] || []));
      setPreviousMonth(aggregate(prevRes.data as any[] || []));
      setCurrentWeek(aggregate(weekRes.data as any[] || []));
    } catch (err) {
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAttributes(); }, [fetchAttributes]);

  return { currentMonth, previousMonth, currentWeek, loading, refetch: fetchAttributes };
}
