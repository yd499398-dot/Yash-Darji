import React, { useState, useEffect } from 'react';
import { Transaction, FinancialForecast } from '../types';
import { generateForecast } from '../services/geminiService';
import { Sparkles, AlertTriangle, CheckCircle, BrainCircuit, ExternalLink, Globe } from 'lucide-react';

interface ForecastViewProps {
  transactions: Transaction[];
}

const ForecastView: React.FC<ForecastViewProps> = ({ transactions }) => {
  const [forecast, setForecast] = useState<FinancialForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate forecast on mount if enough data
  useEffect(() => {
    if (transactions.length < 3) {
      return; 
    }
    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions.length]); // Only re-run if count changes drastically, simplistic check

  const fetchForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await generateForecast(transactions);
      setForecast(data);
    } catch (e) {
      setError("Failed to generate forecast.");
    } finally {
      setLoading(false);
    }
  };

  if (transactions.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-6">
        <BrainCircuit size={64} className="text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Not Enough Data</h3>
        <p className="text-slate-400 max-w-md">
          Please add at least 3 transactions to unlock AI forecasting. The more data you provide, the smarter the insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="text-purple-400" /> AI Forecast
          </h2>
          <p className="text-slate-400">Smart predictions powered by Gemini 3 Flash & Google Search</p>
        </div>
        <button 
          onClick={fetchForecast}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Analyzing...' : 'Refresh Analysis'}
        </button>
      </header>

      {loading && !forecast && (
         <div className="flex flex-col items-center justify-center h-64 bg-slate-800 rounded-2xl animate-pulse">
            <div className="h-8 w-8 bg-purple-500 rounded-full animate-bounce mb-4"></div>
            <p className="text-purple-300">Consulting the financial oracle...</p>
         </div>
      )}

      {!loading && forecast && (
        <div className="space-y-6 animate-fade-in">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 border-l-4 border-l-purple-500">
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Predicted Next Month Spend</p>
              <p className="text-4xl font-bold text-white">${forecast.predictedSpendNextMonth.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">Based on your recent trends</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 border-l-4 border-l-emerald-500">
              <p className="text-slate-400 text-sm uppercase tracking-wider font-semibold mb-1">Potential Savings</p>
              <p className="text-4xl font-bold text-emerald-400">${forecast.savingsPotential.toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-2">If you follow the advice below</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Assessment */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className={
                  forecast.riskFactor === 'High' ? 'text-rose-500' : 
                  forecast.riskFactor === 'Medium' ? 'text-orange-500' : 'text-emerald-500'
                } />
                Risk Factor
              </h3>
              <div className="flex items-center justify-center h-32">
                 <div className={`text-2xl font-black px-6 py-2 rounded-full border-2 ${
                   forecast.riskFactor === 'High' ? 'border-rose-500 text-rose-500 bg-rose-500/10' :
                   forecast.riskFactor === 'Medium' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                   'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                 }`}>
                   {forecast.riskFactor.toUpperCase()}
                 </div>
              </div>
            </div>

            {/* Smart Advice */}
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BrainCircuit size={20} className="text-cyan-400" />
                Gemini's Insights
              </h3>
              <ul className="space-y-4">
                {forecast.advice.map((tip, idx) => (
                  <li key={idx} className="flex gap-4 items-start bg-slate-700/30 p-3 rounded-lg">
                    <CheckCircle className="text-cyan-500 shrink-0 mt-1" size={18} />
                    <p className="text-slate-200 text-sm leading-relaxed">{tip}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Anomalies */}
          {forecast.anomalies.length > 0 && (
             <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl">
                <h4 className="text-slate-300 font-semibold mb-3">Detected Anomalies</h4>
                <div className="flex flex-wrap gap-2">
                  {forecast.anomalies.map((anom, i) => (
                    <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs">
                      {anom}
                    </span>
                  ))}
                </div>
             </div>
          )}

          {/* Search Sources */}
          {forecast.searchSources && forecast.searchSources.length > 0 && (
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
               <div className="flex items-center gap-2 mb-3 text-slate-400">
                  <Globe size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Sources & Context from Google Search</span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forecast.searchSources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 bg-slate-800 hover:bg-slate-700 p-3 rounded-lg border border-slate-700 transition-colors"
                    >
                      <span className="text-xs text-slate-300 group-hover:text-cyan-400 font-medium truncate">
                        {source.title}
                      </span>
                      <ExternalLink size={12} className="text-slate-500 group-hover:text-cyan-400 shrink-0" />
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