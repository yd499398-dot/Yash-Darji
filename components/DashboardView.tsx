
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
        <div className="w-24 h-24 bg-slate-800/40 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-slate-700/50">
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
    <div className="space-y-8 animate-fade-in relative z-10">
      <header className="mb-8">
        <h2 className="text-4xl font-black text-white tracking-tight">Ecosystem Status</h2>
        <p className="text-slate-500 font-medium">Real-time financial intelligence stream.</p>
      </header>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Capital', val: stats.balance, icon: Wallet, color: 'blue', sub: 'Available liquidity' },
          { label: 'Inflow', val: stats.totalIncome, icon: TrendingUp, color: 'emerald', sub: 'Revenue streams' },
          { label: 'Outflow', val: stats.totalExpense, icon: TrendingDown, color: 'rose', sub: 'Operational cost' },
          { label: 'Efficiency', val: stats.savingsRate, icon: Target, color: 'purple', sub: 'Capital retention', suffix: '%' }
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800/50 hover:border-cyan-500/30 transition-all group shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-2xl bg-${stat.color}-500/10 text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</span>
            </div>
            <p className="text-2xl font-black text-white">
              {stat.suffix === '%' ? '' : '$'}{stat.val.toLocaleString(undefined, { minimumFractionDigits: stat.suffix === '%' ? 1 : 2 })}{stat.suffix || ''}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black flex items-center gap-3">
              <Activity size={20} className="text-cyan-400" />
              Pulse Analysis
            </h3>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Bi-Weekly Cycle</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                <XAxis dataKey="date" stroke="#475569" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '20px', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={4} />
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="transparent" strokeWidth={3} strokeDasharray="6 6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget Summary Widget */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black flex items-center gap-3">
              <ShieldCheck size={20} className="text-emerald-400" />
              Thresholds
            </h3>
          </div>
          <div className="space-y-8 flex-1">
            {budgetSummary.length > 0 ? budgetSummary.map((item) => (
              <div key={item.category} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                  <span className={`text-[10px] font-black ${item.percentage >= 100 ? 'text-rose-400' : item.percentage >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    ${item.actual.toFixed(0)} / ${item.limit.toFixed(0)}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800/50">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${item.percentage >= 100 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : item.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                 <Target className="text-slate-700 mb-4" size={48} />
                 <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">Deployment Required</p>
                 <p className="text-[10px] text-slate-700 mt-1">Set targets in the budget module.</p>
              </div>
            )}
          </div>
          <button 
            className="mt-10 w-full py-4 bg-slate-800/30 hover:bg-slate-800/50 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-slate-800/50 transition-all text-slate-400 hover:text-white"
            onClick={() => {}}
          >
            Adjust Protocols
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
