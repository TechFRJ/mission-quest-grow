import { useState } from 'react';
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Wallet, Transaction, FinanceCategory } from '@/hooks/useFinance';
import type { UseMutationResult } from '@tanstack/react-query';

interface Props {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: FinanceCategory[];
  addTransaction: UseMutationResult<void, Error, any>;
}

export default function TransactionsTab({ wallets, transactions, categories, addTransaction }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState('');

  const handleSubmit = () => {
    if (!name || !amount || !walletId) return;
    addTransaction.mutate({
      name,
      amount: parseFloat(amount),
      type,
      wallet_id: walletId,
      category_id: categoryId || null,
      date,
      is_recurring: isRecurring,
      recurrence_day: isRecurring && recurrenceDay ? parseInt(recurrenceDay) : null,
    });
    setName(''); setAmount(''); setShowForm(false);
    setIsRecurring(false); setRecurrenceDay('');
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setShowForm(!showForm)}
        className="w-full bg-primary text-primary-foreground"
        size="sm"
      >
        <Plus className="w-4 h-4 mr-1" /> Nova Transação
      </Button>

      {showForm && (
        <Card className="border border-primary/20 bg-card">
          <CardContent className="p-3 space-y-3">
            {/* Type toggle */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={type === 'expense' ? 'default' : 'outline'}
                className={type === 'expense' ? 'bg-red-500 hover:bg-red-600 flex-1' : 'flex-1'}
                onClick={() => setType('expense')}
              >
                <ArrowDownCircle className="w-3 h-3 mr-1" /> Despesa
              </Button>
              <Button
                size="sm"
                variant={type === 'income' ? 'default' : 'outline'}
                className={type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 flex-1' : 'flex-1'}
                onClick={() => setType('income')}
              >
                <ArrowUpCircle className="w-3 h-3 mr-1" /> Receita
              </Button>
            </div>

            <Input placeholder="Nome da transação" value={name} onChange={e => setName(e.target.value)} />

            <div className="flex gap-2">
              <Input type="number" placeholder="Valor (R$)" value={amount} onChange={e => setAmount(e.target.value)} className="flex-1" />
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" />
            </div>

            {/* Wallet selector */}
            <select
              value={walletId}
              onChange={e => setWalletId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecionar carteira</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name} (R${Number(w.balance).toFixed(0)})</option>
              ))}
            </select>

            {/* Category selector */}
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Sem categoria</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Recurring toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">Recorrente</span>
              {isRecurring && (
                <Input
                  type="number"
                  placeholder="Dia"
                  min={1} max={31}
                  value={recurrenceDay}
                  onChange={e => setRecurrenceDay(e.target.value)}
                  className="w-20 ml-auto"
                />
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!name || !amount || !walletId || addTransaction.isPending}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {addTransaction.isPending ? 'Salvando...' : 'Salvar Transação'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma transação registrada</p>
      ) : (
        transactions.map(tx => {
          const cat = categories.find(c => c.id === tx.category_id);
          const wallet = wallets.find(w => w.id === tx.wallet_id);
          return (
            <Card key={tx.id} className="border-0 bg-card">
              <CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.name}</p>
                  <p className="text-[0.6rem] text-muted-foreground">
                    {cat?.name || ''} · {wallet?.name} · {format(new Date(tx.date + 'T12:00:00'), "dd MMM yyyy", { locale: ptBR })}
                    {tx.is_recurring && ' 🔄'}
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
  );
}
