import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getExerciseImageUrl } from '@/lib/exerciseTranslations';

interface Props {
  name: string;
  size?: number;
  className?: string;
  rounded?: string;
}

export default function ExerciseThumb({ name, size = 40, className = '', rounded = 'rounded-lg' }: Props) {
  const [error, setError] = useState(false);
  const url = getExerciseImageUrl(name);

  if (error || !url) {
    return (
      <div
        className={`flex items-center justify-center bg-muted ${rounded} ${className}`}
        style={{ width: size, height: size }}
      >
        <Dumbbell className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      className={`object-cover bg-muted ${rounded} ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}

export function ExerciseImageLarge({ name, className = '' }: { name: string; className?: string }) {
  const [error, setError] = useState(false);
  const url = getExerciseImageUrl(name);

  if (error || !url) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-xl w-full ${className}`} style={{ height: 200 }}>
        <Dumbbell className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      onError={() => setError(true)}
      className={`w-full object-cover bg-muted rounded-xl ${className}`}
      style={{ height: 200 }}
    />
  );
}
