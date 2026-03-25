import { Home, Target, ShoppingBag, User, Dumbbell, Apple, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/missions', icon: Target, label: 'Missões' },
  { path: '/shop', icon: ShoppingBag, label: 'Loja' },
  { path: '/profile', icon: User, label: 'Perfil' },
  { path: '/workouts', icon: Dumbbell, label: 'Treinos' },
  { path: '/diet', icon: Apple, label: 'Dieta' },
  { path: '/goals', icon: Target, label: 'Metas' },
  { path: '/finance', icon: Wallet, label: 'Finanças' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                'nav-item flex-1 min-w-0 py-3',
                isActive && 'active'
              )}
            >
              <Icon className={cn('w-6 h-6 mb-1 transition-transform', isActive && 'scale-110')} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
