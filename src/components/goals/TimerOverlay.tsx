import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  goalName: string;
  onSave: (seconds: number) => void;
  onClose: () => void;
}

export function TimerOverlay({ goalName, onSave, onClose }: Props) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  // Keep ref in sync
  useEffect(() => {
    secondsRef.current = seconds;
  }, [seconds]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const saveAndClose = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    if (secondsRef.current > 0) {
      onSave(secondsRef.current);
    }
    onClose();
  }, [onSave, onClose]);

  const pause = () => {
    setRunning(false);
    // Save partial on pause
    if (secondsRef.current > 0) {
      onSave(secondsRef.current);
      setSeconds(0);
      secondsRef.current = 0;
    }
  };

  const reset = () => {
    setRunning(false);
    setSeconds(0);
    secondsRef.current = 0;
  };

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-md">
      <button onClick={saveAndClose} className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground">
        <X className="w-6 h-6" />
      </button>
      <div className="text-center">
        <p className="text-sm text-muted-foreground mb-2">{goalName}</p>
        <div className="text-6xl sm:text-7xl font-mono font-bold text-foreground mb-10 tracking-widest" style={{ textShadow: '0 0 20px hsl(var(--primary) / 0.4)' }}>
          {fmt(seconds)}
        </div>
        <div className="flex justify-center gap-4">
          {running ? (
            <Button onClick={pause} variant="destructive" size="lg" className="gap-2">
              <Pause className="w-5 h-5" /> Pausar & Salvar
            </Button>
          ) : (
            <Button onClick={() => setRunning(true)} size="lg" className="gap-2">
              <Play className="w-5 h-5" /> {seconds > 0 ? 'Continuar' : 'Iniciar'}
            </Button>
          )}
          <Button onClick={reset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="w-5 h-5" /> Resetar
          </Button>
        </div>
        {seconds > 0 && !running && (
          <p className="text-xs text-muted-foreground mt-6">
            Ao fechar, {Math.floor(seconds / 60)}min {seconds % 60}s serão salvos.
          </p>
        )}
      </div>
    </div>
  );
}
