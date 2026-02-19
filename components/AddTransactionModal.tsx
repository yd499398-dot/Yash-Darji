
import React, { useState, useEffect, useRef } from 'react';
import { X, Wand2, Loader2, DollarSign, Tag, Calendar as CalendarIcon, ArrowRightLeft, Sparkles, Check, AlertCircle } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { parseTransactionInput, suggestCategory } from '../services/geminiService';
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
  const [error, setError] = useState<string | null>(null);
  
  // Real-time categorization states
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const debounceTimer = useRef<number | null>(null);

  // Magic AI Fill (Full parsing)
  const handleAIFill = async () => {
    if (!description || description.length < 3) return;
    setAiLoading(true);
    setError(null);
    try {
      const result = await parseTransactionInput(description);
      if (result.amount) {
        // Prevent AI from suggesting negative amounts
        setAmount(Math.abs(result.amount).toString());
      }
      if (result.category) setCategory(result.category);
      if (result.type) setType(result.type);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      setSuggestedCategory(null);
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  // Real-time category suggestion logic
  useEffect(() => {
    if (description.length < 4) {
      setSuggestedCategory(null);
      return;
    }

    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);

    debounceTimer.current = window.setTimeout(async () => {
      setIsSuggesting(true);
      const suggestion = await suggestCategory(description);
      if (suggestion && suggestion !== category) {
        setSuggestedCategory(suggestion);
      } else {
        setSuggestedCategory(null);
      }
      setIsSuggesting(false);
    }, 800);

    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [description]);

  const applySuggestion = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setSuggestedCategory(null);
    }
  };

  const validate = (): boolean => {
    const val = parseFloat(amount);
    
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid positive amount.");
      return false;
    }

    if (!date) {
      setError("Please select a date for the transaction.");
      return false;
    }

    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      setError("The selected date format is invalid.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      description: description.trim() || 'Untitled Transaction',
      amount: parseFloat(amount),
      date,
      category,
      type
    });
    onClose();
  };

  // Clear specific errors when user modifies fields
  useEffect(() => {
    if (error) setError(null);
  }, [amount, date]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className={`bg-slate-900/90 w-full max-w-lg rounded-[2.5rem] border border-slate-800/50 shadow-2xl overflow-hidden transition-all duration-300 ${error ? 'animate-shake' : ''}`}>
        <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40">
          <div>
            <h3 className="text-2xl font-black text-white">Log Transaction</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manual or AI entry</p>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-10">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 animate-fade-in">
              <AlertCircle size={18} className="text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-400 uppercase tracking-tight">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* AI Assistant Input */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">
                Transaction Details
              </label>
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g., 'Groceries at Whole Foods $120'"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-5 pl-6 pr-14 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 transition-all text-sm font-semibold"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={aiLoading || !description}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all shadow-lg ${
                    showSuccess ? 'bg-emerald-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                  } disabled:opacity-20`}
                >
                  {aiLoading ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <DollarSign size={14} className="text-cyan-400" /> Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className={`w-full bg-slate-950/50 border ${error?.includes('amount') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-800'} rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-black text-xl`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

               <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <ArrowRightLeft size={14} className="text-purple-400" /> Flow
                </label>
                <div className="flex bg-slate-950/50 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'expense' ? 'bg-slate-800 text-rose-400 shadow-md border border-rose-500/20' : 'text-slate-500'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${type === 'income' ? 'bg-slate-800 text-emerald-400 shadow-md border border-emerald-500/20' : 'text-slate-500'}`}
                  >
                    Income
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <CalendarIcon size={14} className="text-slate-500" /> Date
                </label>
                <input
                  type="date"
                  className={`w-full bg-slate-950/50 border ${error?.includes('date') ? 'border-rose-500 ring-2 ring-rose-500/10' : 'border-slate-800'} rounded-2xl px-6 py-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold`}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Tag size={14} className="text-slate-500" /> Category
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-semibold appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setSuggestedCategory(null);
                    }}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Tag size={14} className="text-slate-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Suggestion Chip */}
            {suggestedCategory && (
              <div className="animate-fade-in-up">
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="w-full flex items-center justify-between p-4 rounded-[1.5rem] bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 group hover:border-purple-500/60 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                      <Sparkles size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest leading-none mb-1">AI Suggestion</p>
                      <p className="text-sm text-slate-200 font-bold">{suggestedCategory}</p>
                    </div>
                  </div>
                  <Check size={18} className="text-purple-400 opacity-0 group-hover:opacity-100 transition-all mr-2" />
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black py-5 rounded-[1.5rem] mt-6 transition-all transform active:scale-[0.98] shadow-2xl shadow-cyan-900/40"
            >
              Verify & Add Transaction
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTransactionModal;
