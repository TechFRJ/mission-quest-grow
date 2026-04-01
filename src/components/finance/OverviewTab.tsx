import { Wallet as WalletIcon, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Wallet, Transaction, FinanceCategory } from '@/hooks/useFinance';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: FinanceCategory[];
}

export default function OverviewTab({ wallets, transactions, categories }: Props) {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-0 bg-emerald-500/10">
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-sm font-bold text-emerald-500">R${totalIncome.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-500/10">
          <CardContent className="p-3 text-center">
            <TrendingDown className="w-4 h-4 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-sm font-bold text-red-500">R${totalExpense.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-primary/10">
          <CardContent className="p-3 text-center">
            <WalletIcon className="w-4 h-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              R${balance.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet bars */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Carteiras</h3>
        {wallets.map(w => {
          const usage = w.type === 'credit' && w.limit
            ? ((Number(w.limit) - Number(w.balance)) / Number(w.limit)) * 100
            : 0;
          const usedAmount = w.type === 'credit' && w.limit ? Number(w.limit) - Number(w.balance) : 0;

          return (
            <Card key={w.id} className="border-0 bg-card">
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                    <span className="text-sm font-medium text-foreground">{w.name}</span>
                    <span className="text-[0.6rem] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {w.type === 'credit' ? 'Crédito' : 'Dinheiro'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    R${Number(w.balance).toFixed(2)}
                  </span>
                </div>
                {w.type === 'credit' && w.limit && (
                  <div className="mt-1">
                    <Progress
                      value={Math.min(usage, 100)}
                      className="h-1.5"
                    />
                    <p className="text-[0.6rem] text-muted-foreground mt-0.5">
                      R${usedAmount.toFixed(0)} / R${Number(w.limit).toFixed(0)} usado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent transactions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Transações Recentes</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma transação ainda</p>
        ) : (
          recent.map(tx => {
            const cat = categories.find(c => c.id === tx.category_id);
            const wallet = wallets.find(w => w.id === tx.wallet_id);
            return (
              <Card key={tx.id} className="border-0 bg-card">
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{tx.name}</p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {cat?.name || 'Sem categoria'} · {wallet?.name} · {format(new Date(tx.date + 'T12:00:00'), 'dd MMM', { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {tx.type === 'expense' ? '-' : '+'}R${Number(tx.amount).toFixed(2)}
                  </span>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
