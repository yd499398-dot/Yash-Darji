
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Trash2, Calendar } from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, onDelete }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, filterType]);

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white tracking-tight">Ledger</h2>
        <p className="text-slate-400">Manage and audit your transaction history</p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search descriptions or categories..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-300 focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </select>
          <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 text-slate-500 text-sm">
            <Filter size={16} />
            <span>{filteredTransactions.length} results</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[11px] uppercase tracking-widest border-b border-slate-700">
                <th className="p-5 font-bold">Transaction Detail</th>
                <th className="p-5 font-bold">Label</th>
                <th className="p-5 font-bold">Timestamp</th>
                <th className="p-5 font-bold text-right">Value</th>
                <th className="p-5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-700/20 transition-all">
                  <td className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.type === 'income' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{t.description}</p>
                        <p className="text-[10px] text-slate-500 font-mono uppercase">{t.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-700/50 border border-slate-600 text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                      {t.category}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                       <Calendar size={12} />
                       {t.date}
                    </div>
                  </td>
                  <td className={`p-5 text-right font-black text-lg ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-5 text-right">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all"
                      title="Delete record"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                       <Search size={32} className="opacity-20" />
                       <p>No transactions matching your filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionsView;
