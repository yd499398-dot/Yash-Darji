
import React, { useState } from 'react';
import { X, Wand2, Loader2, DollarSign, Tag, Calendar as CalendarIcon, ArrowRightLeft } from 'lucide-react';
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
  const [showSuccess, setShowSuccess] = useState(false);

  // Magic AI Fill
  const handleAIFill = async () => {
    if (!description || description.length < 3) return;
    setAiLoading(true);
    try {
      const result = await parseTransactionInput(description);
      if (result.amount) setAmount(result.amount.toString());
      if (result.category) setCategory(result.category);
      if (result.type) setType(result.type);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onSave({
      description: description || 'Untitled Transaction',
      amount: parseFloat(amount),
      date,
      category,
      type
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-white">Log Transaction</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Manual or AI entry</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* AI Assistant Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Natural Language Assistant
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g., 'Weekly groceries at Whole Foods $120'"
                  className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 pl-5 pr-14 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm font-medium"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAIFill())}
                />
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={aiLoading || !description}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all shadow-lg ${
                    showSuccess ? 'bg-emerald-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  } disabled:opacity-30`}
                  title="Auto-fill with AI"
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic pl-1">
                Press Enter to let Gemini identify amount, category, and type.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <DollarSign size={12} /> Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-all font-bold text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ArrowRightLeft size={12} /> Flow Type
                </label>
                <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'expense' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'income' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Income
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <CalendarIcon size={12} /> Date
                </label>
                <input
                  type="date"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all text-xs"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Tag size={12} /> Category
                </label>
                <select
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-all text-xs appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-4 rounded-2xl mt-4 transition-all transform active:scale-[0.98] shadow-xl shadow-cyan-900/20"
            >
              Confirm Transaction
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
