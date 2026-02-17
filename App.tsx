import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ForecastView from './components/ForecastView';
import AddTransactionModal from './components/AddTransactionModal';
import { Transaction, AppView } from './types';
import { INITIAL_TRANSACTIONS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load from local storage on mount (simulating persistence)
  useEffect(() => {
    const saved = localStorage.getItem('finsight_transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved transactions");
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('finsight_transactions', JSON.stringify(transactions));
  }, [transactions]);

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

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView transactions={transactions} />;
      case AppView.TRANSACTIONS:
        return <TransactionsView transactions={transactions} onDelete={handleDeleteTransaction} />;
      case AppView.FORECAST:
        return <ForecastView transactions={transactions} />;
      default:
        return <DashboardView transactions={transactions} />;
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