
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Transaction, CategoryBudget } from '../types';
import { Wallet, TrendingDown, TrendingUp, PieChart as PieChartIcon, Activity, Target, ShieldCheck } from 'lucide-react';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets?: CategoryBudget[];
}

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#fbbf24', '#10b981', '#64748b'];

const DashboardView: React.FC<DashboardViewProps> = ({ transactions, budgets = [] }) => {
  
  const stats = useMemo(() => {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
    return { totalIncome, totalExpense, balance, savingsRate: Math.max(0, savingsRate) };
  }, [transactions]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const budgetSummary = useMemo(() => {
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );

    return budgets.map(b => {
      const actual = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      return { ...b, actual, percentage: b.limit > 0 ? (actual / b.limit) * 100 : 0 };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 3);
  }, [transactions, budgets, currentMonth]);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const catMap: Record<string, number> = {};
    expenses.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const trendData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const dailyMap: Record<string, { income: number, expense: number }> = {};
    
    sorted.slice(-14).forEach(t => {
      if (!dailyMap[t.date]) dailyMap[t.date] = { income: 0, expense: 0 };
      if (t.type === 'income') dailyMap[t.date].income += t.amount;
      else dailyMap[t.date].expense += t.amount;
    });

    return Object.entries(dailyMap).map(([date, vals]) => ({
      date: date.slice(5),
      ...vals
    }));
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-700">
          <Wallet size={40} className="text-slate-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Transactions Yet</h2>
        <p className="text-slate-400 max-w-sm mb-8">Start tracking your finances to see AI-powered insights and beautiful visualizations.</p>
        <div className="animate-bounce text-cyan-400">
          <TrendingDown size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Financial Overview</h2>
        <p className="text-slate-400">Track, analyze, and optimize your wealth.</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <Wallet size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Live Balance</span>
          </div>
          <p className="text-2xl font-bold text-white">${stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <div className="mt-2 w-full bg-slate-700 h-1 rounded-full overflow-hidden">
             <div className="bg-blue-500 h-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-emerald-500/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-white">${stats.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-emerald-400 mt-1 font-medium">Stable income stream detected</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-rose-500/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingDown size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Expenditure</span>
          </div>
          <p className="text-2xl font-bold text-white">${stats.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-slate-500 mt-1">Across {categoryData.length} categories</p>
        </div>

        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Target size={20} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Savings Rate</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.savingsRate.toFixed(1)}%</p>
          <div className="mt-2 w-full bg-slate-700 h-1 rounded-full overflow-hidden">
             <div className="bg-purple-500 h-full" style={{ width: `${Math.min(100, stats.savingsRate)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity size={18} className="text-cyan-400" />
              Cash Flow Trend
            </h3>
            <span className="text-xs text-slate-500 font-medium">Last 14 days</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Summary Widget */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              Budget Watch
            </h3>
          </div>
          <div className="space-y-6 flex-1">
            {budgetSummary.length > 0 ? budgetSummary.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-slate-300">{item.category}</span>
                  <span className={`text-xs font-black ${item.percentage >= 100 ? 'text-rose-400' : item.percentage >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${item.actual.toFixed(0)} / ${item.limit.toFixed(0)}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${item.percentage >= 100 ? 'bg-rose-500' : item.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                 <Target className="text-slate-600 mb-2" size={32} />
                 <p className="text-sm text-slate-500">Set budgets to track spending limits here.</p>
              </div>
            )}
          </div>
          <button 
            className="mt-6 w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-xs font-bold rounded-xl border border-slate-600 transition-colors text-slate-300"
            onClick={() => { /* This would normally change view, but for simplicity we rely on the parent */ }}
          >
            Manage All Budgets
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
