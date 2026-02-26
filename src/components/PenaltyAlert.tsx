import { AlertTriangle, Coins, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface Penalty {
  missionTitle: string;
  coinsLost: number;
  xpLost: number;
  reason: string;
}

interface PenaltyAlertProps {
  penalties: Penalty[];
  onDismiss: () => void;
}

export function PenaltyAlert({ penalties, onDismiss }: PenaltyAlertProps) {
  if (penalties.length === 0) return null;

  const totalCoins = penalties.reduce((sum, p) => sum + p.coinsLost, 0);
  const totalXp = penalties.reduce((sum, p) => sum + p.xpLost, 0);

  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 animate-fade-in-up">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground mb-1">
              Penalidades aplicadas
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Você perdeu missões ontem:
            </p>
            <ul className="space-y-1 mb-2">
              {penalties.map((p, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="text-destructive">•</span>
                  <span className="truncate">{p.missionTitle}</span>
                  {p.coinsLost > 0 && (
                    <span className="flex items-center gap-0.5 text-coin font-mono">
                      <Coins className="w-3 h-3" />-{p.coinsLost}
                    </span>
                  )}
                  {p.xpLost > 0 && (
                    <span className="flex items-center gap-0.5 text-exp font-mono">
                      <Sparkles className="w-3 h-3" />-{p.xpLost}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              {totalCoins > 0 && (
                <span className="text-coin">-{totalCoins} moedas</span>
              )}
              {totalXp > 0 && (
                <span className="text-exp">-{totalXp} EXP</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
