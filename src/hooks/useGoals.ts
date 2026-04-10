import { useState, useEffect, useCallback } from 'react';

// ---- Types ----
interface StudyDay {
  date: string; // YYYY-MM-DD
  minutes: number;
}

interface GymDay {
  date: string; // YYYY-MM-DD
  done: boolean;
}

interface MoneyEntry {
  id: string;
  date: string;
  amount: number;
}

interface StudyData {
  weeklyGoalHours: number;
  days: StudyDay[];
}

interface GymData {
  weeklyGoalDays: number;
  days: GymDay[];
}

interface MoneyData {
  monthlyGoal: number;
  entries: MoneyEntry[];
}

const STUDY_KEY = 'mqg_study_data';
const GYM_KEY = 'mqg_gym_data';
const MONEY_KEY = 'mqg_money_data';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
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
  const [study, setStudy] = useState<StudyData>(() => load(STUDY_KEY, { weeklyGoalHours: 15, days: [] }));
  const [gym, setGym] = useState<GymData>(() => load(GYM_KEY, { weeklyGoalDays: 5, days: [] }));
  const [money, setMoney] = useState<MoneyData>(() => load(MONEY_KEY, { monthlyGoal: 500, entries: [] }));

  useEffect(() => save(STUDY_KEY, study), [study]);
  useEffect(() => save(GYM_KEY, gym), [gym]);
  useEffect(() => save(MONEY_KEY, money), [money]);

  // ---- Study ----
  const addStudyMinutes = useCallback((minutes: number) => {
    setStudy(prev => {
      const d = today();
      const existing = prev.days.find(x => x.date === d);
      const days = existing
        ? prev.days.map(x => x.date === d ? { ...x, minutes: x.minutes + minutes } : x)
        : [...prev.days, { date: d, minutes }];
      return { ...prev, days };
    });
  }, []);

  const setStudyGoal = useCallback((hours: number) => {
    setStudy(prev => ({ ...prev, weeklyGoalHours: hours }));
  }, []);

  const getStudyWeekMinutes = useCallback(() => {
    const weekDates = getWeekDates();
    return study.days
      .filter(d => weekDates.includes(d.date))
      .reduce((sum, d) => sum + d.minutes, 0);
  }, [study.days]);

  const getStudyLast7Days = useCallback(() => {
    const result: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = study.days.find(x => x.date === dateStr);
      result.push({ date: dateStr, minutes: found?.minutes || 0 });
    }
    return result;
  }, [study.days]);

  // ---- Gym ----
  const toggleGymDay = useCallback(() => {
    const d = today();
    setGym(prev => {
      const existing = prev.days.find(x => x.date === d);
      if (existing) {
        return { ...prev, days: prev.days.map(x => x.date === d ? { ...x, done: !x.done } : x) };
      }
      return { ...prev, days: [...prev.days, { date: d, done: true }] };
    });
  }, []);

  const setGymGoal = useCallback((days: number) => {
    setGym(prev => ({ ...prev, weeklyGoalDays: days }));
  }, []);

  const getGymWeekStatus = useCallback(() => {
    const weekDates = getWeekDates();
    return weekDates.map(date => {
      const found = gym.days.find(d => d.date === date);
      return { date, done: found?.done || false };
    });
  }, [gym.days]);

  const getGymWeekCount = useCallback(() => {
    return getGymWeekStatus().filter(d => d.done).length;
  }, [getGymWeekStatus]);

  const getGymLast4Weeks = useCallback(() => {
    const weeks: { weekStart: string; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const now = new Date();
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((day + 6) % 7) - (w * 7));
      let count = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const found = gym.days.find(x => x.date === dateStr && x.done);
        if (found) count++;
      }
      weeks.push({ weekStart: monday.toISOString().slice(0, 10), count });
    }
    return weeks;
  }, [gym.days]);

  // ---- Money ----
  const addMoneyEntry = useCallback((amount: number) => {
    setMoney(prev => ({
      ...prev,
      entries: [...prev.entries, { id: crypto.randomUUID(), date: today(), amount }]
    }));
  }, []);

  const setMoneyGoal = useCallback((goal: number) => {
    setMoney(prev => ({ ...prev, monthlyGoal: goal }));
  }, []);

  const getMoneyMonthTotal = useCallback(() => {
    const monthKey = getCurrentMonthKey();
    return money.entries
      .filter(e => e.date.startsWith(monthKey))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [money.entries]);

  const getMoneyMonthEntries = useCallback(() => {
    const monthKey = getCurrentMonthKey();
    return money.entries.filter(e => e.date.startsWith(monthKey));
  }, [money.entries]);

  // ---- AI Insights ----
  const getInsights = useCallback(() => {
    const insights: string[] = [];
    const studyPct = (getStudyWeekMinutes() / (study.weeklyGoalHours * 60)) * 100;
    const gymCount = getGymWeekCount();
    const moneyPct = (getMoneyMonthTotal() / money.monthlyGoal) * 100;

    if (studyPct < 30) {
      insights.push('📚 Você estudou muito pouco esta semana. Que tal uma sessão de 25 min agora?');
    } else if (studyPct < 50) {
      insights.push('📚 Metade da semana e menos de 50% da meta de estudo. Acelere!');
    } else if (studyPct >= 100) {
      insights.push('📚 Meta de estudo batida! Você é uma máquina! 🎯');
    } else {
      insights.push(`📚 Bom progresso nos estudos! ${Math.round(studyPct)}% concluído.`);
    }

    if (gymCount < gym.weeklyGoalDays) {
      const remaining = gym.weeklyGoalDays - gymCount;
      insights.push(`💪 Faltam ${remaining} dia${remaining > 1 ? 's' : ''} para bater sua meta de academia. Vamos lá!`);
    } else {
      insights.push('💪 Meta de academia atingida! Descanse e recupere. 🏆');
    }

    if (moneyPct >= 100) {
      insights.push('💰 Incrível! Meta financeira batida este mês! Continue assim.');
    } else if (moneyPct >= 70) {
      insights.push('💰 Quase lá! Falta pouco para a meta de poupança.');
    } else if (moneyPct < 30) {
      insights.push('💰 Guarde um pouco hoje. Cada real conta para sua meta!');
    } else {
      insights.push(`💰 ${Math.round(moneyPct)}% da meta de poupança. Bom ritmo!`);
    }

    // motivational extras
    const motivational = [
      '🔥 Disciplina é liberdade. Continue investindo em você.',
      '🧠 Pequenos passos diários criam resultados extraordinários.',
      '⚡ Hoje é o melhor dia para avançar. Não espere a motivação.',
      '🎯 Foco no processo, não no resultado. Os resultados virão.',
      '🚀 Você está construindo a melhor versão de si mesmo.',
    ];
    insights.push(motivational[Math.floor(Math.random() * motivational.length)]);

    return insights;
  }, [study, gym, money, getStudyWeekMinutes, getGymWeekCount, getMoneyMonthTotal]);

  return {
    study, gym, money,
    addStudyMinutes, setStudyGoal, getStudyWeekMinutes, getStudyLast7Days,
    toggleGymDay, setGymGoal, getGymWeekStatus, getGymWeekCount, getGymLast4Weeks,
    addMoneyEntry, setMoneyGoal, getMoneyMonthTotal, getMoneyMonthEntries,
    getInsights,
  };
}
