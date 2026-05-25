import { useState, useEffect, useCallback } from 'react';

// ---- Types ----
export type GoalType = 'study' | 'gym' | 'finance' | 'hydration' | 'reading' | 'meditation' | 'sleep' | 'language';

export interface GoalConfig {
  // study
  totalHours?: number;
  period?: 'weekly' | 'monthly';
  // gym
  daysPerWeek?: number;
  targetDays?: number[]; // 0=Mon..6=Sun
  // finance
  targetAmount?: number;
  financePeriod?: 'monthly' | 'total';
  // hydration
  litersPerDay?: number;
  // reading
  pagesPerDay?: number;
  booksPerMonth?: number;
  readingMode?: 'pages' | 'books';
  bookName?: string;
  // meditation
  minutesPerDay?: number;
  meditationDays?: number[]; // 0=Mon..6=Sun
  // sleep
  hoursPerNight?: number;
  targetBedtime?: string; // HH:MM
  // language
  language?: string;
  langMinutesPerDay?: number;
}

export interface GoalProgress {
  // study / meditation / language: seconds logged per day
  dailySeconds?: Record<string, number>; // YYYY-MM-DD -> seconds
  // gym: days checked
  checkedDays?: string[]; // YYYY-MM-DD[]
  // finance: entries
  financeEntries?: { id: string; date: string; amount: number }[];
  // hydration: cups per day
  dailyCups?: Record<string, number>; // YYYY-MM-DD -> cups (250ml each)
  // reading: pages per day
  dailyPages?: Record<string, number>;
  booksCompleted?: number;
  // sleep: hours per day
  dailySleepHours?: Record<string, number>;
}

export interface Goal {
  id: string;
  type: GoalType;
  name: string;
  color: string;
  config: GoalConfig;
  progress: GoalProgress;
  createdAt: string;
}

const GOALS_KEY = 'mqg_goals';

function loadGoals(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekDates(): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt' | 'progress'>) => {
    const newGoal: Goal = {
      ...goal,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      progress: {},
    };
    setGoals(prev => [...prev, newGoal]);
    return newGoal.id;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Pick<Goal, 'name' | 'color' | 'config'>>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, []);

  const resetProgress = useCallback((id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, progress: {} } : g));
  }, []);

  // ---- Progress updaters ----

  const addSeconds = useCallback((id: string, seconds: number, date?: string) => {
    const d = date || today();
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const dailySeconds = { ...(g.progress.dailySeconds || {}) };
      dailySeconds[d] = (dailySeconds[d] || 0) + seconds;
      return { ...g, progress: { ...g.progress, dailySeconds } };
    }));
  }, []);


  const toggleGymDay = useCallback((id: string, date?: string) => {
    const d = date || today();
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const checked = [...(g.progress.checkedDays || [])];
      const idx = checked.indexOf(d);
      if (idx >= 0) checked.splice(idx, 1);
      else checked.push(d);
      return { ...g, progress: { ...g.progress, checkedDays: checked } };
    }));
  }, []);

  const addFinanceEntry = useCallback((id: string, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const entries = [...(g.progress.financeEntries || [])];
      entries.push({ id: crypto.randomUUID(), date: today(), amount });
      return { ...g, progress: { ...g.progress, financeEntries: entries } };
    }));
  }, []);

  const addCup = useCallback((id: string) => {
    const d = today();
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const dailyCups = { ...(g.progress.dailyCups || {}) };
      dailyCups[d] = (dailyCups[d] || 0) + 1;
      return { ...g, progress: { ...g.progress, dailyCups } };
    }));
  }, []);

  const addPages = useCallback((id: string, pages: number) => {
    const d = today();
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const dailyPages = { ...(g.progress.dailyPages || {}) };
      dailyPages[d] = (dailyPages[d] || 0) + pages;
      return { ...g, progress: { ...g.progress, dailyPages } };
    }));
  }, []);

  const logSleep = useCallback((id: string, hours: number) => {
    const d = today();
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const dailySleepHours = { ...(g.progress.dailySleepHours || {}) };
      dailySleepHours[d] = hours;
      return { ...g, progress: { ...g.progress, dailySleepHours } };
    }));
  }, []);

  // ---- Computed helpers ----

  const getWeekSeconds = useCallback((goal: Goal) => {
    const week = getWeekDates();
    const ds = goal.progress.dailySeconds || {};
    return week.reduce((sum, d) => sum + (ds[d] || 0), 0);
  }, []);

  const getMonthSeconds = useCallback((goal: Goal) => {
    const mk = getCurrentMonthKey();
    const ds = goal.progress.dailySeconds || {};
    return Object.entries(ds)
      .filter(([d]) => d.startsWith(mk))
      .reduce((sum, [, s]) => sum + s, 0);
  }, []);

  const getGymWeekCount = useCallback((goal: Goal) => {
    const week = getWeekDates();
    return (goal.progress.checkedDays || []).filter(d => week.includes(d)).length;
  }, []);

  const getFinanceTotal = useCallback((goal: Goal) => {
    const entries = goal.progress.financeEntries || [];
    if (goal.config.financePeriod === 'monthly') {
      const mk = getCurrentMonthKey();
      return entries.filter(e => e.date.startsWith(mk)).reduce((s, e) => s + e.amount, 0);
    }
    return entries.reduce((s, e) => s + e.amount, 0);
  }, []);

  const getTodayCups = useCallback((goal: Goal) => {
    return (goal.progress.dailyCups || {})[today()] || 0;
  }, []);

  const getTodayPages = useCallback((goal: Goal) => {
    return (goal.progress.dailyPages || {})[today()] || 0;
  }, []);

  const getLast7Days = useCallback((goal: Goal, field: 'dailySeconds' | 'dailyPages' | 'dailySleepHours' | 'dailyCups') => {
    const result: { date: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const data = goal.progress[field] || {};
      result.push({ date: dateStr, value: (data as Record<string, number>)[dateStr] || 0 });
    }
    return result;
  }, []);

  const getSleepAverage = useCallback((goal: Goal) => {
    const last7 = getLast7Days(goal, 'dailySleepHours');
    const filled = last7.filter(d => d.value > 0);
    if (filled.length === 0) return 0;
    return filled.reduce((s, d) => s + d.value, 0) / filled.length;
  }, [getLast7Days]);

  const getStreak = useCallback((goal: Goal) => {
    const ds = goal.progress.dailySeconds || {};
    const checked = goal.progress.checkedDays || [];
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const hasActivity = (ds[dateStr] && ds[dateStr] > 0) || checked.includes(dateStr);
      if (hasActivity) streak++;
      else break;
    }
    return streak;
  }, []);

  // ---- Insights ----
  const getInsights = useCallback(() => {
    const insights: string[] = [];
    for (const goal of goals) {
      switch (goal.type) {
        case 'study':
        case 'language': {
          const totalHours = (goal.config.totalHours || 15);
          const period = goal.config.period || 'weekly';
          const secs = period === 'weekly' ? getWeekSeconds(goal) : getMonthSeconds(goal);
          const pct = (secs / (totalHours * 3600)) * 100;
          if (pct < 30) insights.push(`📚 ${goal.name}: Você estudou pouco. Que tal uma sessão de 25 min agora?`);
          else if (pct >= 100) insights.push(`📚 ${goal.name}: Meta batida! 🎯`);
          else insights.push(`📚 ${goal.name}: ${Math.round(pct)}% concluído. Continue!`);
          break;
        }
        case 'gym': {
          const count = getGymWeekCount(goal);
          const target = goal.config.daysPerWeek || 5;
          if (count >= target) insights.push(`💪 ${goal.name}: Meta atingida! 🏆`);
          else insights.push(`💪 ${goal.name}: Faltam ${target - count} dia(s) esta semana.`);
          break;
        }
        case 'finance': {
          const total = getFinanceTotal(goal);
          const target = goal.config.targetAmount || 500;
          const pct = (total / target) * 100;
          if (pct >= 100) insights.push(`💰 ${goal.name}: Meta financeira batida!`);
          else insights.push(`💰 ${goal.name}: ${Math.round(pct)}% da meta. Continue poupando!`);
          break;
        }
      }
    }
    if (goals.length === 0) {
      insights.push('🎯 Crie sua primeira meta e comece a evoluir!');
    }
    const motivational = [
      '🔥 Disciplina é liberdade. Continue investindo em você.',
      '🧠 Pequenos passos diários criam resultados extraordinários.',
      '⚡ Hoje é o melhor dia para avançar.',
      '🚀 Você está construindo a melhor versão de si mesmo.',
    ];
    insights.push(motivational[Math.floor(Math.random() * motivational.length)]);
    return insights;
  }, [goals, getWeekSeconds, getMonthSeconds, getGymWeekCount, getFinanceTotal]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    resetProgress,
    addSeconds,
    toggleGymDay,
    addFinanceEntry,
    addCup,
    addPages,
    logSleep,
    getWeekSeconds,
    getMonthSeconds,
    getGymWeekCount,
    getFinanceTotal,
    getTodayCups,
    getTodayPages,
    getLast7Days,
    getSleepAverage,
    getStreak,
    getInsights,
    getWeekDates: () => getWeekDates(),
  };
}
