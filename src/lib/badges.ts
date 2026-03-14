// Badge definitions for the achievement system

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'missions' | 'streaks' | 'xp' | 'special';
}

export const BADGES: BadgeDefinition[] = [
  // Mission milestones
  { id: 'first_mission', name: 'Primeira Missão', description: 'Completou a primeira missão', icon: '⚔️', category: 'missions' },
  { id: 'missions_10', name: 'Dedicado', description: 'Completou 10 missões', icon: '🎯', category: 'missions' },
  { id: 'missions_50', name: 'Veterano', description: 'Completou 50 missões', icon: '🛡️', category: 'missions' },
  { id: 'missions_100', name: 'Centurião', description: 'Completou 100 missões', icon: '🏛️', category: 'missions' },
  { id: 'missions_500', name: 'Lendário', description: 'Completou 500 missões', icon: '👑', category: 'missions' },

  // Streak milestones
  { id: 'streak_3', name: 'Consistente', description: '3 dias de streak', icon: '🔥', category: 'streaks' },
  { id: 'streak_7', name: 'Em Chamas', description: '7 dias de streak', icon: '💥', category: 'streaks' },
  { id: 'streak_14', name: 'Inabalável', description: '14 dias de streak', icon: '⚡', category: 'streaks' },
  { id: 'streak_30', name: 'Imparável', description: '30 dias de streak', icon: '🌟', category: 'streaks' },

  // XP milestones
  { id: 'xp_500', name: 'Aprendiz', description: 'Acumulou 500 XP', icon: '✨', category: 'xp' },
  { id: 'xp_2000', name: 'Aventureiro', description: 'Acumulou 2.000 XP', icon: '🗡️', category: 'xp' },
  { id: 'xp_5000', name: 'Herói', description: 'Acumulou 5.000 XP', icon: '🦸', category: 'xp' },
  { id: 'xp_10000', name: 'Mestre', description: 'Acumulou 10.000 XP', icon: '🧙', category: 'xp' },

  // Special
  { id: 'category_10', name: 'Especialista', description: '10 missões da mesma categoria', icon: '🏅', category: 'special' },
  { id: 'all_categories', name: 'Multifacetado', description: 'Completou missões em 5+ categorias', icon: '🌈', category: 'special' },
  { id: 'level_5', name: 'Evoluído', description: 'Alcançou o nível 5', icon: '🆙', category: 'xp' },
  { id: 'level_10', name: 'Elite', description: 'Alcançou o nível 10', icon: '💎', category: 'xp' },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id);
}
