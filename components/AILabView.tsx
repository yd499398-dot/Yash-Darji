
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Mic, Video, Image as ImageIcon, MessageSquare, 
  MapPin, Search, Brain, Zap, Play, Loader2, Upload, 
  Trash2, Send, Wand2, Volume2, Globe, Key, FileVideo
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';

// --- Encoding/Decoding Helpers for Live API ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AILabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'creative' | 'intelligence' | 'live' | 'search'>('intelligence');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // --- Live Chat State ---
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- Search/Maps State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [groundingSources, setGroundingSources] = useState<any[]>([]);

  // --- Creative State ---
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBase64File(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- Video Generation (Veo) ---
  const generateVideo = async (imageOnly = false) => {
    if (!prompt && !base64File) return;
    setLoading(true);
    try {
      if (!(window as any).aistudio?.hasSelectedApiKey()) {
        await (window as any).aistudio?.openSelectKey();
      }
      // Fix: Initialize GoogleGenAI right before the API call
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      };

      const payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this scene',
        config
      };

      if (base64File) {
        payload.image = {
          imageBytes: base64File.split(',')[1],
          mimeType: selectedFile?.type || 'image/png'
        };
      }

      let operation = await ai.models.generateVideos(payload);
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      setResult({ type: 'video', url: `${downloadLink}&key=${process.env.API_KEY}` });
    } catch (e) {
      console.error(e);
      alert("Error generating video. Ensure a paid API key is selected.");
    } finally {
      setLoading(false);
    }
  };

  // --- Pro Intelligence (Chat, Thinking, Analysis) ---
  const runIntelligence = async (mode: 'thinking' | 'analysis' | 'edit') => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any = prompt;
      
      if (selectedFile) {
        const filePart = {
          inlineData: {
            data: base64File?.split(',')[1],
            mimeType: selectedFile.type
          }
        };
        contents = { parts: [filePart, { text: prompt || "Analyze this media." }] };
      }

      const config: any = {};
      if (mode === 'thinking') {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents,
        config
      });
      // Fix: Access response.text property directly
      setResult({ type: 'text', content: response.text });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Search & Maps Grounding ---
  const runGrounding = async (tool: 'search' | 'maps') => {
    setLoading(true);
    setGroundingSources([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const config: any = { tools: [] };
      let model = 'gemini-3-flash-preview';

      if (tool === 'search') {
        config.tools.push({ googleSearch: {} });
      } else {
        // Fix: Use recommended alias for gemini flash as maps is supported in 2.5 series
        model = 'gemini-flash-latest';
        config.tools.push({ googleMaps: {} });
        
        // Try to get location
        const pos: any = await new Promise((res) => navigator.geolocation.getCurrentPosition(res, () => res(null)));
        if (pos) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
            }
          };
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents: searchQuery,
        config
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.map((c: any) => c.web || c.maps).filter(Boolean);
      setGroundingSources(sources);
      // Fix: Access response.text property directly
      setResult({ type: 'text', content: response.text });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Live API Session ---
  const startLiveSession = async () => {
    setIsLiveActive(true);
    setTranscriptions([]);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const outAudioCtx = new AudioContext({ sampleRate: 24000 });
    const inAudioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = outAudioCtx;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          const source = inAudioCtx.createMediaStreamSource(stream);
          const processor = inAudioCtx.createScriptProcessor(4096, 1, 1);
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            // Fix: Initiate sendRealtimeInput after live.connect call resolves
            sessionPromise.then(s => s.sendRealtimeInput({ 
              media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
            }));
          };
          source.connect(processor);
          processor.connect(inAudioCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.outputTranscription) {
            setTranscriptions(prev => [...prev, `AI: ${msg.serverContent!.outputTranscription!.text}`]);
          }
          const audioBase64 = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioBase64) {
            const buffer = await decodeAudioData(decode(audioBase64), outAudioCtx, 24000, 1);
            const source = outAudioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outAudioCtx.destination);
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioCtx.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            audioSourcesRef.current.add(source);
          }
          if (msg.serverContent?.interrupted) {
            audioSourcesRef.current.forEach(s => s.stop());
            audioSourcesRef.current.clear();
          }
        },
        onerror: (e) => console.error(e),
        onclose: (e) => console.log("Closed", e)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });
    liveSessionRef.current = sessionPromise;
  };

  const stopLiveSession = () => {
    setIsLiveActive(false);
    liveSessionRef.current?.then((s: any) => s.close());
    audioSourcesRef.current.forEach(s => s.stop());
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <header>
        <h2 className="text-4xl font-black text-white flex items-center gap-4">
          <Sparkles className="text-cyan-400" /> AI Command Center
        </h2>
        <p className="text-slate-500 font-medium">Multi-modal intelligence and generation lab.</p>
      </header>

      {/* Lab Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl w-fit">
        {[
          { id: 'intelligence', label: 'Pro Insights', icon: Brain },
          { id: 'creative', label: 'Creative Studio', icon: Video },
          { id: 'live', label: 'Native Live', icon: Mic },
          { id: 'search', label: 'Grounding', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setResult(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Interactive Controls */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl space-y-8">
          
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Context / Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a complex question or describe media to analyze..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-white min-h-[120px] focus:border-cyan-500/50 transition-all outline-none"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runIntelligence('thinking')}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50"
                >
                  <Brain size={20} /> Deep Think
                </button>
                <button 
                  onClick={() => runIntelligence('analysis')}
                  disabled={loading}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Search size={20} /> Pro Analysis
                </button>
              </div>
            </div>
          )}

          {activeTab === 'creative' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Creative Directive</label>
                <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. 'Cinematic landscape flyover of a cyberpunk city'"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => generateVideo()}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Play size={20} />} Veo Generation
                </button>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
               <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Query</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recent news or find nearby places..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-5 pl-12 text-white outline-none focus:border-cyan-500/50"
                  />
                  <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runGrounding('search')}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Globe size={20} /> Google Search
                </button>
                <button 
                  onClick={() => runGrounding('maps')}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <MapPin size={20} /> Google Maps
                </button>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
             <div className="flex flex-col items-center justify-center py-10 space-y-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                  isLiveActive ? 'bg-rose-500 animate-pulse shadow-2xl shadow-rose-500/40' : 'bg-cyan-500 shadow-xl shadow-cyan-500/20'
                }`}>
                  <Mic size={48} className="text-white" />
                </div>
                <div className="text-center">
                   <h3 className="text-xl font-bold text-white mb-2">{isLiveActive ? 'Live Audio Stream Active' : 'Native Audio Chat'}</h3>
                   <p className="text-sm text-slate-500 max-w-xs">Low-latency, real-time voice interaction with Gemini 2.5 Flash.</p>
                </div>
                <button
                  onClick={isLiveActive ? stopLiveSession : startLiveSession}
                  className={`w-full py-4 rounded-2xl font-black text-white transition-all ${
                    isLiveActive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-cyan-600 hover:bg-cyan-500'
                  }`}
                >
                  {isLiveActive ? 'Terminate Session' : 'Initiate Session'}
                </button>
             </div>
          )}

          {/* Media Upload (Shared) */}
          {(activeTab === 'intelligence' || activeTab === 'creative') && (
            <div className="pt-8 border-t border-slate-800/50">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Media Input (Images/Video)</label>
               <div className="flex gap-4 items-center">
                  <label className="cursor-pointer bg-slate-800/50 hover:bg-slate-800 p-4 rounded-2xl border border-dashed border-slate-700 flex-1 flex flex-col items-center gap-2 transition-all">
                     <Upload size={24} className="text-slate-500" />
                     <span className="text-xs font-bold text-slate-400">Upload Reference</span>
                     <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                  </label>
                  {base64File && (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-700">
                       <img src={base64File} className="w-full h-full object-cover" />
                       <button 
                        onClick={() => { setSelectedFile(null); setBase64File(null); }}
                        className="absolute top-1 right-1 p-1 bg-slate-900/80 rounded-lg text-rose-500"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* Right: Output / Results */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl flex flex-col min-h-[500px]">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> AI Intelligence Output
          </h3>

          <div className="flex-1 overflow-y-auto space-y-6">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                 <Loader2 className="animate-spin text-cyan-500" size={48} />
                 <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Neural Processing in Progress...</p>
              </div>
            )}

            {!loading && result?.type === 'text' && (
              <div className="bg-slate-950/40 p-6 rounded-2xl border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {result.content}
              </div>
            )}

            {!loading && result?.type === 'video' && (
              <div className="space-y-4">
                 <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
                    <video src={result.url} controls autoPlay className="w-full" />
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Veo Generation Successful</span>
                    <a href={result.url} download className="text-xs font-bold text-cyan-400 hover:underline">Download Asset</a>
                 </div>
              </div>
            )}

            {!loading && groundingSources.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Grounding Sources</p>
                <div className="grid grid-cols-1 gap-2">
                  {groundingSources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 hover:bg-slate-800 transition-all text-xs font-bold text-cyan-400 truncate flex items-center gap-2">
                      <Globe size={14} /> {s.title || s.uri}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Fix: Use 'transcriptions' instead of 'transcriptionHistory' */}
            {!loading && activeTab === 'live' && transcriptions.length > 0 && (
              <div className="space-y-4">
                {transcriptions.map((t, i) => (
                   <div key={i} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 text-xs font-medium text-slate-300 italic">
                      {t}
                   </div>
                ))}
              </div>
            )}

            {!loading && !result && !isLiveActive && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                 <Brain size={64} className="text-slate-600" />
                 <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Awaiting Command Initiation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILabView;
