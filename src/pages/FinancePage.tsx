import { Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinance } from '@/hooks/useFinance';
import OverviewTab from '@/components/finance/OverviewTab';
import TransactionsTab from '@/components/finance/TransactionsTab';
import RecurringTab from '@/components/finance/RecurringTab';
import CategoriesTab from '@/components/finance/CategoriesTab';
import WalletsTab from '@/components/finance/WalletsTab';

export default function FinancePage() {
  const { wallets, categories, transactions, loading, addTransaction, toggleRecurring, addWallet, updateWallet, deleteWallet } = useFinance();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 pt-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Finanças</h1>
          <p className="text-xs text-muted-foreground">Gerencie carteiras, transações e categorias</p>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-5 mb-4 h-10">
          <TabsTrigger value="overview" className="text-[11px]">Visão Geral</TabsTrigger>
          <TabsTrigger value="wallets" className="text-[11px]">Carteiras</TabsTrigger>
          <TabsTrigger value="transactions" className="text-[11px]">Transações</TabsTrigger>
          <TabsTrigger value="recurring" className="text-[11px]">Fixas</TabsTrigger>
          <TabsTrigger value="categories" className="text-[11px]">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab wallets={wallets} transactions={transactions} categories={categories} />
        </TabsContent>
        <TabsContent value="wallets">
          <WalletsTab wallets={wallets} addWallet={addWallet} updateWallet={updateWallet} deleteWallet={deleteWallet} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTab wallets={wallets} transactions={transactions} categories={categories} addTransaction={addTransaction} />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringTab transactions={transactions} wallets={wallets} categories={categories} toggleRecurring={toggleRecurring} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab transactions={transactions} categories={categories} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
