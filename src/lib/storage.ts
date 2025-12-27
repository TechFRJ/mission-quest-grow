// LocalStorage utilities for persistent data management

export interface Mission {
  id: string;
  title: string;
  category: string;
  type: 'normal' | 'daily';
  validDays: number[]; // 0-6, Sunday = 0
  exp: number;
  coins: number;
  active: boolean;
  createdAt: string;
}

export interface Completion {
  missionId: string;
  date: string; // YYYY-MM-DD format
  exp: number;
  coins: number;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  createdAt: string;
}

export interface Purchase {
  rewardId: string;
  rewardName: string;
  cost: number;
  date: string;
}

export interface UserData {
  level: number;
  currentExp: number;
  totalExp: number;
  coins: number;
  completions: Completion[];
  purchases: Purchase[];
}

const STORAGE_KEYS = {
  USER: 'quest_user_data',
  MISSIONS: 'quest_missions',
  REWARDS: 'quest_rewards',
} as const;

// Calculate EXP needed for a given level (exponential growth)
export function expForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

// Calculate level from total EXP
export function calculateLevel(totalExp: number): { level: number; currentExp: number; expToNext: number } {
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

// Get today's date in YYYY-MM-DD format
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Get current day of week (0 = Sunday, 6 = Saturday)
export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

// Check if a date string is today
export function isToday(dateString: string): boolean {
  return dateString === getTodayString();
}

// Check if a date string is this week
export function isThisWeek(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return date >= startOfWeek;
}

// Check if a date string is this month
export function isThisMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// User data management
export function getUserData(): UserData {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  if (stored) {
    return JSON.parse(stored);
  }
  return {
    level: 1,
    currentExp: 0,
    totalExp: 0,
    coins: 0,
    completions: [],
    purchases: [],
  };
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data));
}

// Missions management
export function getMissions(): Mission[] {
  const stored = localStorage.getItem(STORAGE_KEYS.MISSIONS);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export function saveMissions(missions: Mission[]): void {
  localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
}

export function addMission(mission: Omit<Mission, 'id' | 'createdAt'>): Mission {
  const missions = getMissions();
  const newMission: Mission = {
    ...mission,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  missions.push(newMission);
  saveMissions(missions);
  return newMission;
}

export function updateMission(id: string, updates: Partial<Mission>): void {
  const missions = getMissions();
  const index = missions.findIndex(m => m.id === id);
  if (index !== -1) {
    missions[index] = { ...missions[index], ...updates };
    saveMissions(missions);
  }
}

export function deleteMission(id: string): void {
  const missions = getMissions().filter(m => m.id !== id);
  saveMissions(missions);
}

// Get today's available missions
export function getTodayMissions(): Mission[] {
  const missions = getMissions();
  const today = getTodayDayOfWeek();
  const userData = getUserData();
  const todayStr = getTodayString();
  
  return missions.filter(mission => {
    if (!mission.active) return false;
    
    if (mission.type === 'normal') {
      // Check if already completed
      return !userData.completions.some(c => c.missionId === mission.id);
    }
    
    if (mission.type === 'daily') {
      // Check if valid for today and not yet completed today
      const validToday = mission.validDays.includes(today);
      const completedToday = userData.completions.some(
        c => c.missionId === mission.id && c.date === todayStr
      );
      return validToday && !completedToday;
    }
    
    return false;
  });
}

// Complete a mission
export function completeMission(missionId: string): { levelUp: boolean; newLevel: number; expGained: number; coinsGained: number } | null {
  const missions = getMissions();
  const mission = missions.find(m => m.id === missionId);
  if (!mission) return null;
  
  const userData = getUserData();
  const today = getTodayString();
  
  // Check if already completed (for daily missions, check today only)
  if (mission.type === 'normal') {
    if (userData.completions.some(c => c.missionId === missionId)) {
      return null;
    }
  } else if (mission.type === 'daily') {
    if (userData.completions.some(c => c.missionId === missionId && c.date === today)) {
      return null;
    }
  }
  
  const oldLevel = userData.level;
  
  // Add completion
  userData.completions.push({
    missionId,
    date: today,
    exp: mission.exp,
    coins: mission.coins,
  });
  
  // Update totals
  userData.totalExp += mission.exp;
  userData.coins += mission.coins;
  
  // Recalculate level
  const { level, currentExp } = calculateLevel(userData.totalExp);
  userData.level = level;
  userData.currentExp = currentExp;
  
  saveUserData(userData);
  
  return {
    levelUp: level > oldLevel,
    newLevel: level,
    expGained: mission.exp,
    coinsGained: mission.coins,
  };
}

// Rewards management
export function getRewards(): Reward[] {
  const stored = localStorage.getItem(STORAGE_KEYS.REWARDS);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export function saveRewards(rewards: Reward[]): void {
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(rewards));
}

export function addReward(reward: Omit<Reward, 'id' | 'createdAt'>): Reward {
  const rewards = getRewards();
  const newReward: Reward = {
    ...reward,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  rewards.push(newReward);
  saveRewards(rewards);
  return newReward;
}

export function deleteReward(id: string): void {
  const rewards = getRewards().filter(r => r.id !== id);
  saveRewards(rewards);
}

// Purchase a reward
export function purchaseReward(rewardId: string): boolean {
  const rewards = getRewards();
  const reward = rewards.find(r => r.id === rewardId);
  if (!reward) return false;
  
  const userData = getUserData();
  if (userData.coins < reward.cost) return false;
  
  userData.coins -= reward.cost;
  userData.purchases.push({
    rewardId,
    rewardName: reward.name,
    cost: reward.cost,
    date: getTodayString(),
  });
  
  saveUserData(userData);
  return true;
}

// Statistics
export function getStats() {
  const userData = getUserData();
  const today = getTodayString();
  
  const completionsToday = userData.completions.filter(c => isToday(c.date)).length;
  const completionsWeek = userData.completions.filter(c => isThisWeek(c.date)).length;
  const completionsMonth = userData.completions.filter(c => isThisMonth(c.date)).length;
  const totalCompletions = userData.completions.length;
  
  const { level, currentExp, expToNext } = calculateLevel(userData.totalExp);
  
  return {
    level,
    currentExp,
    expToNext,
    totalExp: userData.totalExp,
    coins: userData.coins,
    completionsToday,
    completionsWeek,
    completionsMonth,
    totalCompletions,
    recentCompletions: userData.completions.slice(-10).reverse(),
    purchases: userData.purchases.slice(-10).reverse(),
  };
}

// Day names for UI
export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
