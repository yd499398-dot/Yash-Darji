
import React from 'react';
import { LayoutDashboard, List, TrendingUp, Plus, PieChart, Sparkles } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onAddTransaction: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView, onAddTransaction }) => {
  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col md:flex-row relative">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:w-64 bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/50 flex-col justify-between h-screen sticky top-0">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                FinSight
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Intelligence</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { id: AppView.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
              { id: AppView.TRANSACTIONS, label: 'Transactions', icon: List },
              { id: AppView.BUDGETS, label: 'Budgets', icon: PieChart },
              { id: AppView.FORECAST, label: 'AI Insights', icon: TrendingUp },
              { id: AppView.AI_LAB, label: 'AI Command', icon: Sparkles },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 group ${
                  currentView === item.id 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <item.icon size={20} className={currentView === item.id ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
           <button
            onClick={onAddTransaction}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white p-4 rounded-2xl font-black shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-3 transition-all transform active:scale-95"
          >
            <Plus size={20} />
            Quick Add
          </button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/50 rounded-[2.5rem] h-20 flex items-center justify-between px-4 shadow-2xl relative">
          
          <button 
            onClick={() => onChangeView(AppView.DASHBOARD)}
            className={`p-3 rounded-2xl transition-all active-scale ${currentView === AppView.DASHBOARD ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
          >
            <LayoutDashboard size={24} />
          </button>

          <button 
            onClick={() => onChangeView(AppView.TRANSACTIONS)}
            className={`p-3 rounded-2xl transition-all active-scale ${currentView === AppView.TRANSACTIONS ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
          >
            <List size={24} />
          </button>

          {/* Floating Action Button Centered */}
          <div className="relative -top-8">
            <button
              onClick={onAddTransaction}
              className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-700 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/40 border-4 border-slate-950 transition-transform active:scale-90"
            >
              <Plus size={32} className="text-white" strokeWidth={3} />
            </button>
          </div>

          <button 
            onClick={() => onChangeView(AppView.BUDGETS)}
            className={`p-3 rounded-2xl transition-all active-scale ${currentView === AppView.BUDGETS ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
          >
            <PieChart size={24} />
          </button>

          <button 
            onClick={() => onChangeView(AppView.AI_LAB)}
            className={`p-3 rounded-2xl transition-all active-scale ${currentView === AppView.AI_LAB ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'}`}
          >
            <Sparkles size={24} />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto h-screen p-4 md:p-10 pb-32 md:pb-10 bg-transparent"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
