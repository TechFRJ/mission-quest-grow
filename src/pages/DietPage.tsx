import { Apple } from 'lucide-react';

export default function DietPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
          <Apple className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-bold text-foreground mb-1 tracking-tight">Dieta</h1>
        <p className="text-xs text-muted-foreground">Em breve — acompanhe sua alimentação</p>
      </div>
    </div>
  );
}
