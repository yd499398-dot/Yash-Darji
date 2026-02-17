
import React, { useState, useEffect } from 'react';
import { Transaction, FinancialForecast } from '../types';
import { generateForecast } from '../services/geminiService';
// Added TrendingUp to the lucide-react imports to fix the 'Cannot find name' error
import { Sparkles, AlertTriangle, CheckCircle, BrainCircuit, ExternalLink, Globe, Loader2, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

interface ForecastViewProps {
  transactions: Transaction[];
}

const ForecastView: React.FC<ForecastViewProps> = ({ transactions }) => {
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const steps = [
    "Compiling transaction history...",
    "Scanning global economic trends...",
    "Grounding advice with Google Search...",
    "Synthesizing financial predictions..."
  ];

  useEffect(() => {
    if (transactions.length < 3) return;
    if (!forecast) fetchForecast();
  }, [transactions.length]);

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setStep(prev => (prev + 1) % steps.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchForecast = async () => {
    setLoading(true);
    setStep(0);
    try {
      const data = await generateForecast(transactions);
      setForecast(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (transactions.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="relative mb-8">
           <BrainCircuit size={80} className="text-slate-800" />
           <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-purple-500/40 animate-pulse" size={40} />
           </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Insufficient Intelligence</h3>
        <p className="text-slate-400 max-w-md">
          Gemini requires at least 3 transactions to establish a behavioral baseline for financial forecasting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-purple-400" /> AI Strategic Analysis
          </h2>
          <p className="text-slate-400 text-sm">Powered by Gemini 3 Flash & Google Real-time Search</p>
        </div>
        <button 
          onClick={fetchForecast}
          disabled={loading}
          className="group relative px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center gap-2 overflow-hidden"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          <span>{loading ? 'Consulting Gemini...' : 'Regenerate Strategy'}</span>
        </button>
      </header>

      {loading && (
         <div className="flex flex-col items-center justify-center h-80 bg-slate-800/40 rounded-3xl border border-dashed border-slate-700 animate-pulse transition-all">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
               <Zap className="text-purple-400 animate-bounce" size={32} />
            </div>
            <div className="text-center">
               <p className="text-lg font-bold text-white mb-1">{steps[step]}</p>
               <p className="text-slate-500 text-xs uppercase tracking-widest font-mono">Quantum AI Processing</p>
            </div>
         </div>
      )}

      {!loading && forecast && (
        <div className="space-y-6">
          {/* Main Forecast Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <TrendingUp size={120} />
              </div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-black mb-2">Projected Monthly Burn</p>
              <p className="text-5xl font-black text-white">${forecast.predictedSpendNextMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-900/50 w-fit px-3 py-1.5 rounded-full">
                <BrainCircuit size={14} className="text-purple-400" />
                BASED ON HISTORICAL VARIANCE
              </div>
            </div>

            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <ShieldCheck size={120} />
              </div>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-black mb-2">Efficiency Potential</p>
              <p className="text-5xl font-black text-emerald-400">${forecast.savingsPotential.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-500/80 bg-emerald-500/10 w-fit px-3 py-1.5 rounded-full border border-emerald-500/20">
                <CheckCircle size={14} />
                OPTIMIZATION TARGET
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Assessment */}
            <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 w-full text-left">Volatility Scan</h3>
              <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center mb-4 transition-colors ${
                   forecast.riskFactor === 'High' ? 'border-rose-500/20 bg-rose-500/5' :
                   forecast.riskFactor === 'Medium' ? 'border-orange-500/20 bg-orange-500/5' :
                   'border-emerald-500/20 bg-emerald-500/5'
                 }`}>
                 <span className={`text-2xl font-black ${
                   forecast.riskFactor === 'High' ? 'text-rose-500' : 
                   forecast.riskFactor === 'Medium' ? 'text-orange-500' : 'text-emerald-500'
                 }`}>
                   {forecast.riskFactor}
                 </span>
                 <span className="text-[10px] font-bold text-slate-500">FACTOR</span>
              </div>
              <p className="text-xs text-slate-400 px-4">Risk level is calculated using spending frequency and unexpected outflows.</p>
            </div>

            {/* Strategic Tips */}
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <BrainCircuit size={16} className="text-cyan-400" />
                Strategic Directives
              </h3>
              <div className="space-y-3">
                {forecast.advice.map((tip, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-700/20 p-4 rounded-2xl hover:bg-slate-700/40 transition-colors border border-transparent hover:border-slate-600">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 font-bold text-xs">
                      {idx + 1}
                    </div>
                    <p className="text-slate-200 text-sm font-medium leading-tight">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sources Section */}
          {forecast.searchSources && forecast.searchSources.length > 0 && (
            <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800">
               <div className="flex items-center gap-3 mb-5">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-none">Economic Grounding</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Contextualized via Google Real-time Search</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forecast.searchSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex flex-col justify-between bg-slate-800 hover:bg-slate-700/80 p-4 rounded-2xl border border-slate-700 transition-all hover:-translate-y-1"
                    >
                      <span className="text-xs text-slate-300 font-bold line-clamp-2 mb-4">
                        {source.title}
                      </span>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{new URL(source.uri).hostname}</span>
                        <ExternalLink size={12} className="text-slate-500 group-hover:text-cyan-400" />
                      </div>
                    </a>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForecastView;
