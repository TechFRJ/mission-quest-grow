import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Transaction, FinanceCategory } from '@/hooks/useFinance';

interface Props {
  transactions: Transaction[];
  categories: FinanceCategory[];
}

export default function CategoriesTab({ transactions, categories }: Props) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.type === 'expense';
  });

  return (
    <div className="space-y-3">
      {categories.map(cat => {
        const spent = thisMonth
          .filter(t => t.category_id === cat.id)
          .reduce((s, t) => s + Number(t.amount), 0);
        const budget = Number(cat.budget);
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

        return (
          <Card key={cat.id} className="border-0 bg-card">
            <CardContent className="p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  R${spent.toFixed(0)} {budget > 0 ? `/ R$${budget.toFixed(0)}` : ''}
                </span>
              </div>
              {budget > 0 && (
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full transition-all rounded-full ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
              {budget > 0 && pct >= 90 && (
                <p className="text-[0.6rem] text-red-500 mt-1">⚠️ Orçamento quase esgotado!</p>
              )}
              {budget > 0 && pct >= 70 && pct < 90 && (
                <p className="text-[0.6rem] text-amber-500 mt-1">Atenção: 70%+ do orçamento usado</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
