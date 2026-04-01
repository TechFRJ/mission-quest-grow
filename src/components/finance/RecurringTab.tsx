import { RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import type { Transaction, Wallet, FinanceCategory } from '@/hooks/useFinance';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: FinanceCategory[];
  toggleRecurring: UseMutationResult<void, Error, { id: string; active: boolean }>;
}

export default function RecurringTab({ transactions, wallets, categories, toggleRecurring }: Props) {
  const recurring = transactions.filter(t => t.is_recurring);
  const activeRecurring = recurring.filter(t => t.active);
  const totalMonthly = activeRecurring
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-3">
      {/* Monthly total */}
      <Card className="border-0 bg-primary/10">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Total mensal fixo</span>
          </div>
          <span className="text-sm font-bold text-red-500">R${totalMonthly.toFixed(2)}</span>
        </CardContent>
      </Card>

      {recurring.length === 0 ? (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma despesa recorrente</p>
          <p className="text-xs text-muted-foreground">Adicione transações com "Recorrente" marcado</p>
        </div>
      ) : (
        recurring.map(tx => {
          const cat = categories.find(c => c.id === tx.category_id);
          const wallet = wallets.find(w => w.id === tx.wallet_id);
          return (
            <Card key={tx.id} className={`border-0 ${tx.active ? 'bg-card' : 'bg-muted opacity-60'}`}>
              <CardContent className="p-3 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{tx.name}</p>
                    {tx.recurrence_day && (
                      <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        Dia {tx.recurrence_day}
                      </span>
                    )}
                  </div>
                  <p className="text-[0.6rem] text-muted-foreground">
                    {cat?.name || ''} · {wallet?.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    R${Number(tx.amount).toFixed(2)}
                  </span>
                  <Switch
                    checked={tx.active}
                    onCheckedChange={(checked) => toggleRecurring.mutate({ id: tx.id, active: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
