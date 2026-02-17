import React from 'react';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ transactions, onDelete }) => {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-bold text-white">Transactions</h2>
        <p className="text-slate-400">Full history of your income and expenses</p>
      </header>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-400 text-sm">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Description</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium text-right">Amount</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 text-slate-300 text-sm whitespace-nowrap">{t.date}</td>
                  <td className="p-4 text-white font-medium flex items-center gap-3">
                    <span className={`p-1.5 rounded-full ${t.type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {t.type === 'income' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                    {t.description}
                  </td>
                  <td className="p-4 text-slate-400 text-sm">
                    <span className="px-2 py-1 rounded-md bg-slate-700/50 border border-slate-600">
                      {t.category}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => onDelete(t.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No transactions found. Add one to get started!
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