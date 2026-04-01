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
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Finanças</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full grid grid-cols-5 mb-4">
          <TabsTrigger value="overview" className="text-xs">Visão Geral</TabsTrigger>
          <TabsTrigger value="wallets" className="text-xs">Carteiras</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">Transações</TabsTrigger>
          <TabsTrigger value="recurring" className="text-xs">Fixas</TabsTrigger>
          <TabsTrigger value="categories" className="text-xs">Categorias</TabsTrigger>
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
