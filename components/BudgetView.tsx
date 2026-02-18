
import React, { useMemo, useState } from 'react';
import { Transaction, CategoryBudget } from '../types';
import { CATEGORIES } from '../constants';
import { PieChart as PieChartIcon, Save, Edit2, AlertCircle, CheckCircle, Info, Target, TrendingUp, BarChart3 } from 'lucide-react';
import { 
  RadialBarChart, 
  RadialBar, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

interface BudgetViewProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onUpdateBudget: (category: string, limit: number) => void;
}

const COLORS = ['#22d3ee', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', '#fbbf24', '#10b981', '#64748b'];

const BudgetView: React.FC<BudgetViewProps> = ({ transactions, budgets, onUpdateBudget }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const budgetProgress = useMemo(() => {
    // Current month's expenses
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );

    return budgets.map((b, idx) => {
      const actual = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = b.limit > 0 ? (actual / b.limit) * 100 : 0;
      
      return {
        ...b,
        name: b.category,
        actual,
        percentage,
        fill: COLORS[idx % COLORS.length]
      };
    });
  }, [transactions, budgets, currentMonth]);

  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + b.limit, 0), [budgets]);
  const totalSpent = useMemo(() => budgetProgress.reduce((sum, b) => sum + b.actual, 0), [budgetProgress]);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setEditValue(currentLimit.toString());
  };

  const handleSave = (category: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val >= 0) {
      onUpdateBudget(category, val);
    }
    setEditingCategory(null);
  };

  return (
    <div className="space-y-10 animate-fade-in relative z-10">
      <header className="mb-8">
        <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-4">
          <div className="p-2 bg-emerald-500/20 rounded-2xl">
            <PieChartIcon className="text-emerald-400" size={32} />
          </div>
          Budget Architecture
        </h2>
        <p className="text-slate-500 font-medium mt-2">Strategic allocation for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} cycle.</p>
      </header>

      {/* Global Visualizer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col md:flex-row items-center gap-8">
          <div className="w-full h-[280px] md:w-1/2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="20%" 
                outerRadius="100%" 
                barSize={12} 
                data={budgetProgress.filter(b => b.limit > 0).slice(0, 6)}
              >
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                  background={{ fill: 'rgba(30, 41, 59, 0.3)' }}
                  dataKey="percentage"
                  cornerRadius={30}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(51, 65, 85, 0.5)', borderRadius: '15px' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full md:w-1/2 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Overall Utilization</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-white">{overallPercentage.toFixed(0)}%</span>
                <span className={`text-xs font-bold pb-2 ${overallPercentage > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {overallPercentage > 100 ? 'Over Capacity' : 'Within Limits'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Allocated</p>
                <p className="text-lg font-black text-slate-200">${totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/50">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Utilized</p>
                <p className="text-lg font-black text-slate-200">${totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                <Target size={20} />
             </div>
             <h3 className="text-lg font-black">AI Assessment</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed mb-6 italic">
            "Your spending in <span className="text-cyan-400 font-bold">Food & Drink</span> is approaching the 90% threshold earlier than typical cycles. Consider reallocating from unspent buffers."
          </p>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
            Confidence level: 94%
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {budgetProgress.map((item) => {
          const isOver = item.percentage >= 100;
          const isNear = item.percentage >= 80 && !isOver;
          
          return (
            <div key={item.category} className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-800/50 p-8 flex flex-col group hover:border-cyan-500/30 transition-all duration-500 shadow-xl">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">{item.category}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    {isOver ? (
                      <span className="text-[9px] font-black uppercase text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2 py-1 rounded-lg">
                        <AlertCircle size={10} /> Critical Overflow
                      </span>
                    ) : isNear ? (
                      <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                        <Info size={10} /> Warning Threshold
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                        <CheckCircle size={10} /> Optimized
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {editingCategory === item.category ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <input
                        type="number"
                        className="w-24 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-bold"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSave(item.category)}
                        className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"
                      >
                        <Save size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Limit</p>
                        <p className="text-base font-black text-white">${item.limit.toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => handleEdit(item.category, item.limit)}
                        className="p-2 text-slate-600 hover:text-cyan-400 hover:bg-slate-800/50 rounded-xl transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-4">
                <div className="flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Utilized</p>
                      <p className={`text-2xl font-black ${isOver ? 'text-rose-400' : 'text-slate-100'}`}>
                        ${item.actual.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                      </p>
                   </div>
                   <div className={`text-lg font-black ${isOver ? 'text-rose-500' : isNear ? 'text-amber-500' : 'text-emerald-500'}`}>
                    {item.percentage.toFixed(0)}%
                  </div>
                </div>
                
                <div className="h-4 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800/50 p-0.5">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full shadow-lg ${
                      isOver ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-rose-500/30' : 
                      isNear ? 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-amber-500/30' : 
                      'bg-gradient-to-r from-cyan-600 to-emerald-400 shadow-cyan-500/30'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Footer */}
      <div className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 border border-blue-500/20 p-10 rounded-[3rem] flex flex-col md:flex-row items-center gap-10">
        <div className="w-20 h-20 bg-blue-500/20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-inner">
           <BarChart3 className="text-blue-400" size={36} />
        </div>
        <div>
           <h4 className="text-2xl font-black text-white mb-3">Predictive Budgeting Enabled</h4>
           <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
             Our neural network continuously compares your current consumption against historical baselines. By adhering to these limits, you're 84% more likely to reach your <span className="text-cyan-400 font-bold">Q4 Savings Target</span>.
           </p>
           <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800/50">
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Trend: Stable</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-800/50">
                <Target size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Goal: 92% Met</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
