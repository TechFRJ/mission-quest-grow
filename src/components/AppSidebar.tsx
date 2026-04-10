import { useState } from 'react';
import { Home, Target, ShoppingBag, User, Dumbbell, Apple, Crosshair, Wallet, Coins, Sparkles, Flame, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/missions', icon: Target, label: 'Missões' },
  { path: '/goals', icon: Crosshair, label: 'Metas' },
  { path: '/workouts', icon: Dumbbell, label: 'Treinos' },
  { path: '/diet', icon: Apple, label: 'Dieta' },
  { path: '/finance', icon: Wallet, label: 'Finanças' },
  { path: '/shop', icon: ShoppingBag, label: 'Loja' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useGame();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 h-screen z-50 bg-card border-r border-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center glow-primary shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-lg tracking-wider text-primary">
            QuestLife
          </span>
        )}
      </div>

      {/* Stats */}
      <div className={cn('flex gap-2 px-3 py-3 border-b border-border shrink-0', collapsed ? 'flex-col items-center' : 'flex-wrap')}>
        {stats.globalStreak > 0 && (
          <div className="stat-badge streak text-xs">
            <Flame className="w-3 h-3" />
            {!collapsed && <span className="font-mono font-bold">{stats.globalStreak}</span>}
          </div>
        )}
        <div className="stat-badge level text-xs">
          {!collapsed && <span>Nv.</span>}
          <span className="font-mono font-bold">{stats.level}</span>
        </div>
        <div className="stat-badge coin text-xs">
          <Coins className="w-3 h-3" />
          {!collapsed && <span className="font-mono font-bold">{stats.coins}</span>}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 no-scrollbar">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 relative',
                isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-r bg-primary glow-primary" />
              )}
              <Icon className={cn('w-5 h-5 shrink-0', isActive && 'drop-shadow-[0_0_6px_hsl(190_100%_50%/0.6)]')} />
              {!collapsed && <span className="font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-border p-3 shrink-0">
        <div className={cn('flex items-center gap-2 mb-2', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-secondary" />
          </div>
          {!collapsed && (
            <span className="text-xs text-muted-foreground truncate">
              {user?.email || 'Usuário'}
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

export function MobileTopNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useGame();

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border h-14">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(!open)} className="p-1 text-muted-foreground">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-sm tracking-wider text-primary">QuestLife</span>
          </div>
          <div className="flex items-center gap-1.5">
            {stats.globalStreak > 0 && (
              <div className="stat-badge streak text-[10px] px-1.5 py-0.5">
                <Flame className="w-3 h-3" />
                <span className="font-mono font-bold">{stats.globalStreak}</span>
              </div>
            )}
            <div className="stat-badge level text-[10px] px-1.5 py-0.5">
              <span className="font-mono font-bold">Nv.{stats.level}</span>
            </div>
            <div className="stat-badge coin text-[10px] px-1.5 py-0.5">
              <Coins className="w-3 h-3" />
              <span className="font-mono font-bold">{stats.coins}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {open && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-b border-border animate-fade-in">
          <div className="grid grid-cols-4 gap-1 p-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 px-2 rounded-lg text-xs transition-all',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
