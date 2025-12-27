import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  Mission,
  Reward,
  getUserData,
  getMissions,
  getRewards,
  addMission as storageAddMission,
  updateMission as storageUpdateMission,
  deleteMission as storageDeleteMission,
  addReward as storageAddReward,
  deleteReward as storageDeleteReward,
  completeMission as storageCompleteMission,
  purchaseReward as storagePurchaseReward,
  getTodayMissions,
  getStats,
  calculateLevel,
} from '@/lib/storage';

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
  addMission: (mission: Omit<Mission, 'id' | 'createdAt'>) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  completeMission: (missionId: string) => CompletionResult | null;
  addReward: (reward: Omit<Reward, 'id' | 'createdAt'>) => void;
  deleteReward: (id: string) => void;
  purchaseReward: (rewardId: string) => boolean;
  refreshData: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [todayMissions, setTodayMissions] = useState<Mission[]>([]);
  const [stats, setStats] = useState<Stats>(getStats());

  const refreshData = useCallback(() => {
    setMissions(getMissions());
    setRewards(getRewards());
    setTodayMissions(getTodayMissions());
    setStats(getStats());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addMission = useCallback((mission: Omit<Mission, 'id' | 'createdAt'>) => {
    storageAddMission(mission);
    refreshData();
  }, [refreshData]);

  const updateMission = useCallback((id: string, updates: Partial<Mission>) => {
    storageUpdateMission(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteMission = useCallback((id: string) => {
    storageDeleteMission(id);
    refreshData();
  }, [refreshData]);

  const completeMission = useCallback((missionId: string): CompletionResult | null => {
    const result = storageCompleteMission(missionId);
    refreshData();
    return result;
  }, [refreshData]);

  const addReward = useCallback((reward: Omit<Reward, 'id' | 'createdAt'>) => {
    storageAddReward(reward);
    refreshData();
  }, [refreshData]);

  const deleteReward = useCallback((id: string) => {
    storageDeleteReward(id);
    refreshData();
  }, [refreshData]);

  const purchaseReward = useCallback((rewardId: string): boolean => {
    const success = storagePurchaseReward(rewardId);
    refreshData();
    return success;
  }, [refreshData]);

  return (
    <GameContext.Provider
      value={{
        missions,
        rewards,
        todayMissions,
        stats,
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
