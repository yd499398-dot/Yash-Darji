
import React from 'react';
import { LayoutDashboard, List, TrendingUp, PlusCircle, PieChart } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onAddTransaction: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onAddTransaction }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar / Mobile Bottom Nav */}
      <nav className="md:w-64 bg-slate-800 border-r border-slate-700 flex flex-col justify-between fixed md:relative bottom-0 w-full z-20 md:h-screen">
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            FinSight AI
          </h1>
          <p className="text-xs text-slate-400 mt-1">Smart Money Management</p>
        </div>

        <div className="flex md:flex-col justify-around md:justify-start md:px-4 md:gap-2 p-2 bg-slate-800 md:bg-transparent border-t md:border-t-0 border-slate-700">
          <button
            onClick={() => onChangeView(AppView.DASHBOARD)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentView === AppView.DASHBOARD ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard size={24} />
            <span className="hidden md:block font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => onChangeView(AppView.TRANSACTIONS)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentView === AppView.TRANSACTIONS ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List size={24} />
            <span className="hidden md:block font-medium">Transactions</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.BUDGETS)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentView === AppView.BUDGETS ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart size={24} />
            <span className="hidden md:block font-medium">Budgets</span>
          </button>

          <button
            onClick={() => onChangeView(AppView.FORECAST)}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              currentView === AppView.FORECAST ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={24} />
            <span className="hidden md:block font-medium">AI Forecast</span>
          </button>

           <button
            onClick={onAddTransaction}
            className="md:hidden flex items-center justify-center p-3 text-cyan-400"
          >
            <PlusCircle size={32} />
          </button>
        </div>

        <div className="p-4 hidden md:block">
           <button
            onClick={onAddTransaction}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white p-3 rounded-lg font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <PlusCircle size={20} />
            Add New
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen p-4 md:p-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
