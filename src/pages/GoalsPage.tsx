import { Target } from 'lucide-react';

export default function GoalsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Metas</h1>
        <p className="text-sm text-muted-foreground">Coming soon</p>
      </div>
    </div>
  );
}
