import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
      isVisible ? 'opacity-100' : 'opacity-0'
    )}>
      <div className={cn(
        'bg-card rounded-2xl p-8 text-center shadow-elevated max-w-sm mx-4 transition-all duration-300',
        isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      )}>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 level-up-animation">
          <Sparkles className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">Nível {level}!</h2>
        <p className="text-muted-foreground">
          Parabéns! Você subiu de nível! Continue assim! 🎉
        </p>
      </div>
    </div>
  );
}
