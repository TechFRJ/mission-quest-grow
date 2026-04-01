import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/contexts/GameContext';
import { useToast } from '@/hooks/use-toast';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  type: 'cash' | 'credit';
  limit: number | null;
  color: string;
  created_at: string;
}

export interface FinanceCategory {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  budget: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  wallet_id: string;
  category_id: string | null;
  type: 'expense' | 'income';
  date: string;
  is_recurring: boolean;
  recurrence_day: number | null;
  active: boolean;
  created_at: string;
}

const DEFAULT_WALLETS = [
  { name: 'Total Geral', balance: 2000, type: 'cash', limit: null, color: '#22c55e' },
  { name: 'Cartão Crédito', balance: 400, type: 'credit', limit: 400, color: '#6366f1' },
  { name: 'Cartão 2', balance: 200, type: 'credit', limit: 200, color: '#f59e0b' },
];

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: 'Utensils', budget: 800 },
  { name: 'Transporte', icon: 'Car', budget: 300 },
  { name: 'Moradia', icon: 'Home', budget: 1200 },
  { name: 'Lazer', icon: 'Gamepad2', budget: 200 },
  { name: 'Saúde', icon: 'Heart', budget: 300 },
  { name: 'Educação', icon: 'GraduationCap', budget: 200 },
  { name: 'Outros', icon: 'Tag', budget: 0 },
];

export function useFinance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { stats, refreshData: refreshGame } = useGame();
  const queryClient = useQueryClient();

  const walletsQuery = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('wallets' as any) as any).select('*').eq('user_id', user.id).order('created_at');
      if (error) throw error;
      // Seed defaults if empty
      if (!data || data.length === 0) {
        const inserts = DEFAULT_WALLETS.map(w => ({ ...w, user_id: user.id }));
        const { data: seeded } = await (supabase.from('wallets' as any) as any).insert(inserts).select();
        return (seeded || []) as Wallet[];
      }
      return data as Wallet[];
    },
    enabled: !!user,
  });

  const categoriesQuery = useQuery({
    queryKey: ['finance_categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('finance_categories' as any) as any).select('*').eq('user_id', user.id).order('created_at');
      if (error) throw error;
      if (!data || data.length === 0) {
        const inserts = DEFAULT_CATEGORIES.map(c => ({ ...c, user_id: user.id }));
        const { data: seeded } = await (supabase.from('finance_categories' as any) as any).insert(inserts).select();
        return (seeded || []) as FinanceCategory[];
      }
      return data as FinanceCategory[];
    },
    enabled: !!user,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase.from('transactions' as any) as any).select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as Transaction[];
    },
    enabled: !!user,
  });

  const addTransaction = useMutation({
    mutationFn: async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'active'>) => {
      if (!user) throw new Error('Not authenticated');

      // Insert transaction
      const { error } = await (supabase.from('transactions' as any) as any).insert({
        ...tx, user_id: user.id, active: true,
      });
      if (error) throw error;

      const wallets = walletsQuery.data || [];
      const wallet = wallets.find(w => w.id === tx.wallet_id);
      if (!wallet) return;

      const amountDelta = tx.type === 'expense' ? -tx.amount : tx.amount;

      // Update wallet balance
      await (supabase.from('wallets' as any) as any)
        .update({ balance: wallet.balance + amountDelta })
        .eq('id', wallet.id);

      // If credit card expense, also deduct from "Total Geral" (main cash wallet)
      if (tx.type === 'expense' && wallet.type === 'credit') {
        const mainWallet = wallets.find(w => w.type === 'cash');
        if (mainWallet) {
          await (supabase.from('wallets' as any) as any)
            .update({ balance: mainWallet.balance - tx.amount })
            .eq('id', mainWallet.id);
        }
      }

      // Award 10 XP
      const newXp = stats.totalExp + 10;
      const newCoins = stats.coins + 2;
      await supabase.from('profiles').update({ xp: newXp, coins: newCoins }).eq('user_id', user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      refreshGame();
      toast({ title: '✅ Transação adicionada!', description: '+10 XP' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar transação', variant: 'destructive' });
    },
  });

  const toggleRecurring = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await (supabase.from('transactions' as any) as any).update({ active }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateCategoryBudget = useMutation({
    mutationFn: async ({ id, budget }: { id: string; budget: number }) => {
      await (supabase.from('finance_categories' as any) as any).update({ budget }).eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance_categories'] });
    },
  });

  return {
    wallets: walletsQuery.data || [],
    categories: categoriesQuery.data || [],
    transactions: transactionsQuery.data || [],
    loading: walletsQuery.isLoading || categoriesQuery.isLoading || transactionsQuery.isLoading,
    addTransaction,
    toggleRecurring,
    updateCategoryBudget,
  };
}
