import { useState } from 'react';
import {
  Home, Target, ShoppingBag, User, Dumbbell, Apple,
  Crosshair, Wallet, Coins, Flame, ChevronLeft,
  ChevronRight, Menu, X, Zap, LogOut,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
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
  const { user, signOut } = useAuth();

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 h-screen z-50 transition-all duration-300 border-r border-border',
        'bg-[hsl(225_15%_7%)]',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-14 border-b border-border shrink-0',
        collapsed ? 'justify-center px-2' : 'gap-3 px-4'
      )}>
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <Zap className="w-4.5 h-4.5 text-primary" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm tracking-tight text-foreground">
            MQG
          </span>
        )}
      </div>

      {/* Quick stats */}
      <div className={cn(
        'flex gap-1.5 py-3 border-b border-border shrink-0',
        collapsed ? 'flex-col items-center px-2' : 'flex-wrap px-3'
      )}>
        <div className="stat-badge level">
          <span className="font-mono font-bold text-[10px]">Nv.{stats.level}</span>
        </div>
        <div className="stat-badge coin">
          <Coins className="w-3 h-3" />
          {!collapsed && <span className="font-mono font-bold text-[10px]">{stats.coins}</span>}
        </div>
        {stats.globalStreak > 0 && (
          <div className="stat-badge streak">
            <Flame className="w-3 h-3" />
            {!collapsed && <span className="font-mono font-bold text-[10px]">{stats.globalStreak}</span>}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-1.5 no-scrollbar">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'w-full flex items-center gap-3 py-2.5 text-[13px] transition-all duration-150 relative group',
                collapsed ? 'justify-center px-2' : 'px-4',
                isActive
                  ? 'text-primary bg-primary/8'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 rounded-r-full bg-primary" />
              )}
              <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive && 'text-primary')} />
              {!collapsed && <span className="font-medium">{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User + Collapse */}
      <div className="border-t border-border p-3 shrink-0 space-y-2">
        <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut()}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
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
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-13 border-b border-border bg-[hsl(225_15%_7%)]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setOpen(!open)} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-display font-bold text-xs tracking-tight text-foreground">MQG</span>
            </div>
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
        <div className="md:hidden fixed top-13 left-0 right-0 z-40 bg-[hsl(225_15%_7%)]/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <div className="grid grid-cols-4 gap-0.5 p-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  onClick={() => { navigate(path); setOpen(false); }}
                  className={cn(
                    'flex flex-col items-center gap-1 py-3 px-1 rounded-lg text-[11px] transition-all',
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
