
import React, { useMemo, useState } from 'react';
import { Transaction, CategoryBudget } from '../types';
import { CATEGORIES } from '../constants';
import { PieChart, Save, Edit2, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface BudgetViewProps {
  transactions: Transaction[];
  budgets: CategoryBudget[];
  onUpdateBudget: (category: string, limit: number) => void;
}

const BudgetView: React.FC<BudgetViewProps> = ({ transactions, budgets, onUpdateBudget }) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const budgetProgress = useMemo(() => {
    // Current month's expenses
    const monthlyExpenses = transactions.filter(t => 
      t.type === 'expense' && t.date.startsWith(currentMonth)
    );

    return budgets.map(b => {
      const actual = monthlyExpenses
        .filter(t => t.category === b.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = b.limit > 0 ? (actual / b.limit) * 100 : 0;
      
      return {
        ...b,
        actual,
        percentage
      };
    });
  }, [transactions, budgets, currentMonth]);

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
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <PieChart className="text-emerald-400" />
          Monthly Budgets
        </h2>
        <p className="text-slate-400">Set limits for your spending and track real-time progress for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {budgetProgress.map((item) => {
          const isOver = item.percentage >= 100;
          const isNear = item.percentage >= 80 && !isOver;
          
          return (
            <div key={item.category} className="bg-slate-800 rounded-2xl border border-slate-700 p-6 flex flex-col transition-all hover:border-slate-600">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">{item.category}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {isOver ? (
                      <span className="text-[10px] font-black uppercase text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} /> Budget Exceeded
                      </span>
                    ) : isNear ? (
                      <span className="text-[10px] font-black uppercase text-amber-500 flex items-center gap-1">
                        <Info size={12} /> Near Limit
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1">
                        <CheckCircle size={12} /> On Track
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {editingCategory === item.category ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSave(item.category)}
                        className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                      >
                        <Save size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <div className="text-sm font-medium text-slate-400">
                        Limit: <span className="text-white font-bold">${item.limit.toLocaleString()}</span>
                      </div>
                      <button 
                        onClick={() => handleEdit(item.category, item.limit)}
                        className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 font-medium">Spent: <span className="text-slate-200">${item.actual.toFixed(2)}</span></span>
                  <span className={`${isOver ? 'text-rose-400' : isNear ? 'text-amber-400' : 'text-emerald-400'} font-black`}>
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out rounded-full ${
                      isOver ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 
                      isNear ? 'bg-gradient-to-r from-amber-600 to-amber-400' : 
                      'bg-gradient-to-r from-emerald-600 to-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-blue-500/5 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4">
        <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
           <Info size={24} />
        </div>
        <div>
           <h4 className="text-white font-bold mb-1">Budgeting Pro-Tip</h4>
           <p className="text-slate-400 text-sm leading-relaxed">
             Regularly setting and adjusting budgets helps the AI provide more accurate forecasts. Visit the <span className="text-purple-400 font-medium cursor-pointer" onClick={() => {}}>AI Forecast</span> tab to see how your current budget adherence impacts your financial future.
           </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
