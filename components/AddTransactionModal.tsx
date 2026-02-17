import React, { useState } from 'react';
import { X, Wand2, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { parseTransactionInput } from '../services/geminiService';
import { Transaction } from '../types';

interface AddTransactionModalProps {
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'>) => void;
}

const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose, onSave }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [aiLoading, setAiLoading] = useState(false);

  // Magic AI Fill
  const handleAIFill = async () => {
    if (!description || description.length < 3) return;
    setAiLoading(true);
    try {
      const result = await parseTransactionInput(description);
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.type) setType(result.type);
      // Optional: Update description if AI cleaned it up
      // if (result.description) setDescription(result.description);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      description,
      amount: parseFloat(amount),
      date,
      category,
      type
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-white">Add Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* AI Assistant Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Add (AI)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., 'Starbucks coffee $5.50'"
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => { if(description) handleAIFill(); }}
                />
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={aiLoading || !description}
                  className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                  title="Auto-fill with AI"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Type a natural phrase and click the wand to auto-fill details.
              </p>
            </div>

            <div className="h-px bg-slate-700 my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
               <div className="space-y-1">
                <label className="text-sm text-slate-400">Type</label>
                <select
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  value={type}
                  onChange={(e) => setType(e.target.value as 'expense' | 'income')}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-400">Date</label>
              <input
                type="date"
                required
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-400">Category</label>
              <select
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg mt-6 transition-all transform active:scale-95"
            >
              Save Transaction
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;