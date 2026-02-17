
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ForecastView from './components/ForecastView';
import BudgetView from './components/BudgetView';
import AddTransactionModal from './components/AddTransactionModal';
import { Transaction, AppView, CategoryBudget } from './types';
import { INITIAL_TRANSACTIONS, CATEGORIES } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from local storage on mount
  useEffect(() => {
    const savedTxs = localStorage.getItem('finsight_transactions');
    if (savedTxs) {
      try {
        setTransactions(JSON.parse(savedTxs));
      } catch (e) {
        console.error("Failed to parse saved transactions");
      }
    }

    const savedBudgets = localStorage.getItem('finsight_budgets');
    if (savedBudgets) {
      try {
        setBudgets(JSON.parse(savedBudgets));
      } catch (e) {
        console.error("Failed to parse saved budgets");
      }
    } else {
      // Default budgets for categories (excluding Income)
      const defaults = CATEGORIES
        .filter(c => c !== 'Income')
        .map(c => ({ category: c, limit: 500 }));
      setBudgets(defaults);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('finsight_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finsight_budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleUpdateBudget = (category: string, limit: number) => {
    setBudgets(prev => {
      const exists = prev.find(b => b.category === category);
      if (exists) {
        return prev.map(b => b.category === category ? { ...b, limit } : b);
      }
      return [...prev, { category, limit }];
    });
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView transactions={transactions} budgets={budgets} />;
      case AppView.TRANSACTIONS:
        return <TransactionsView transactions={transactions} onDelete={handleDeleteTransaction} />;
      case AppView.FORECAST:
        return <ForecastView transactions={transactions} />;
      case AppView.BUDGETS:
        return <BudgetView transactions={transactions} budgets={budgets} onUpdateBudget={handleUpdateBudget} />;
      default:
        return <DashboardView transactions={transactions} budgets={budgets} />;
    }
  };

  return (
    <Layout 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onAddTransaction={() => setIsModalOpen(true)}
    >
      {renderView()}
      
      {isModalOpen && (
        <AddTransactionModal 
          onClose={() => setIsModalOpen(false)}
          onSave={handleAddTransaction}
        />
      )}
    </Layout>
  );
};

export default App;
