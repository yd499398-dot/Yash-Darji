
import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Mic, Video, Image as ImageIcon, MessageSquare, 
  MapPin, Search, Brain, Zap, Play, Loader2, Upload, 
  Trash2, Send, Wand2, Volume2, Globe, FileVideo,
  Ear, MessageCircle, FileAudio, Settings, HelpCircle
} from 'lucide-react';
import { GoogleGenAI, Modality, Type, LiveServerMessage } from '@google/genai';

// --- Base64 / Audio Helpers ---
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
  const [activeTab, setActiveTab] = useState<'intelligence' | 'creative' | 'live' | 'search'>('intelligence');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // Intelligence State
  const [prompt, setPrompt] = useState('');
  const [useThinking, setUseThinking] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [base64File, setBase64File] = useState<string | null>(null);
  
  // Live API State
  const [isLiveActive, setIsLiveActive] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const [transcriptions, setTranscriptions] = useState<string[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Search/Maps State
  const [groundingQuery, setGroundingQuery] = useState('');
  const [groundingSources, setGroundingSources] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBase64File(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // --- 1. PRO INTELLIGENCE (Chat, Thinking, Analysis, Transcription) ---
  const runIntelligence = async (mode: 'pro' | 'transcribe') => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let contents: any = [{ text: prompt || (mode === 'transcribe' ? "Transcribe this audio perfectly." : "Analyze this.") }];
      
      if (base64File) {
        contents = {
          parts: [
            { inlineData: { data: base64File.split(',')[1], mimeType: selectedFile?.type || 'image/png' } },
            ...contents
          ]
        };
      }

      const config: any = {};
      if (mode === 'pro' && useThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
      }

      const model = mode === 'transcribe' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
      
      const response = await ai.models.generateContent({ model, contents, config });
      setResult({ type: 'text', content: response.text });
    } catch (e) {
      console.error(e);
      setResult({ type: 'error', content: "Failed to process request." });
    } finally {
      setLoading(false);
    }
  };

  // --- 2. CREATIVE STUDIO (Video Gen, Image Edit) ---
  const runCreative = async (mode: 'video' | 'edit') => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      if (mode === 'video') {
        if (!(window as any).aistudio?.hasSelectedApiKey()) {
          await (window as any).aistudio?.openSelectKey();
        }
        
        const payload: any = {
          model: 'veo-3.1-fast-generate-preview',
          prompt: prompt || 'Cinematic money flowing in a digital space',
          config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
        };

        if (base64File) {
          payload.image = { imageBytes: base64File.split(',')[1], mimeType: selectedFile?.type || 'image/png' };
        }

        let operation = await ai.models.generateVideos(payload);
        while (!operation.done) {
          await new Promise(r => setTimeout(r, 5000));
          operation = await ai.operations.getVideosOperation({ operation });
        }
        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        setResult({ type: 'video', url: `${downloadLink}&key=${process.env.API_KEY}` });
      } else {
        // Nano Banana Image Edit
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { inlineData: { data: base64File?.split(',')[1], mimeType: selectedFile?.type || 'image/png' } },
              { text: prompt || "Apply a professional financial aesthetic." }
            ]
          }
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setResult({ type: 'image', url: `data:image/png;base64,${part.inlineData.data}` });
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. GROUNDING (Search, Maps) ---
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
        model = 'gemini-2.5-flash';
        config.tools.push({ googleMaps: {} });
        const pos: any = await new Promise(r => navigator.geolocation.getCurrentPosition(r, () => r(null)));
        if (pos) {
          config.toolConfig = { retrievalConfig: { latLng: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } } };
        }
      }

      const response = await ai.models.generateContent({
        model,
        contents: groundingQuery || "What's happening in the markets?",
        config
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.map((c: any) => c.web || c.maps).filter(Boolean);
      setGroundingSources(sources);
      setResult({ type: 'text', content: response.text });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. LIVE AUDIO SESSION ---
  const startLive = async () => {
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
            sessionPromise.then(s => s.sendRealtimeInput({ media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } }));
          };
          source.connect(processor);
          processor.connect(inAudioCtx.destination);
        },
        onmessage: async (msg: LiveServerMessage) => {
          if (msg.serverContent?.outputTranscription) setTranscriptions(p => [...p, `AI: ${msg.serverContent!.outputTranscription!.text}`]);
          const audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            const buffer = await decodeAudioData(decode(audio), outAudioCtx, 24000, 1);
            const source = outAudioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(outAudioCtx.destination);
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outAudioCtx.currentTime);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
            audioSourcesRef.current.add(source);
          }
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        outputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } }
      }
    });
    liveSessionRef.current = sessionPromise;
  };

  const stopLive = () => {
    setIsLiveActive(false);
    liveSessionRef.current?.then((s: any) => s.close());
    audioSourcesRef.current.forEach(s => s.stop());
  };

  // --- 5. TEXT TO SPEECH (TTS) ---
  const speakResult = async () => {
    if (!result?.content) return;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: result.content }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
        }
      });
      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioBase64) {
        const ctx = new AudioContext({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioBase64), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black text-white flex items-center gap-4">
            <Sparkles className="text-cyan-400" /> Command Center
          </h2>
          <p className="text-slate-500 font-medium mt-2">Multi-modal neural laboratory.</p>
        </div>
      </header>

      {/* Lab Nav */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 rounded-3xl w-fit">
        {[
          { id: 'intelligence', label: 'Intelligence', icon: Brain },
          { id: 'creative', label: 'Creative', icon: Video },
          { id: 'live', label: 'Live Session', icon: Mic },
          { id: 'search', label: 'Grounding', icon: Globe },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setResult(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* INPUT COLUMN */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800/50 shadow-2xl space-y-8">
          
          {activeTab === 'intelligence' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Input</label>
                   <button 
                    onClick={() => setUseThinking(!useThinking)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1 transition-all ${useThinking ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                   >
                     <Zap size={10} /> {useThinking ? 'Thinking Active' : 'Thinking Off'}
                   </button>
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask complex queries, upload documents, analyze videos..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl p-6 text-white min-h-[160px] focus:border-cyan-500/50 transition-all outline-none text-sm font-medium leading-relaxed"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runIntelligence('pro')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-cyan-900/20 transition-all disabled:opacity-50"
                >
                  <MessageSquare size={18} /> Pro Reasoning
                </button>
                <button 
                  onClick={() => runIntelligence('transcribe')}
                  disabled={loading}
                  className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  title="Transcribe Audio"
                >
                  <FileAudio size={18} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'creative' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generation Prompt</label>
                <input 
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your visual masterpiece..."
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-5 text-white outline-none focus:border-cyan-500/50 font-bold"
                />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runCreative('video')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Video size={18} />} Veo Generator
                </button>
                <button 
                  onClick={() => runCreative('edit')}
                  disabled={loading || !base64File}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                >
                  <ImageIcon size={18} /> Nano Edit
                </button>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
               <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Grounding Query</label>
                <div className="relative">
                  <input 
                    type="text"
                    value={groundingQuery}
                    onChange={(e) => setGroundingQuery(e.target.value)}
                    placeholder="Search market trends or find banks nearby..."
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-5 pl-14 text-white outline-none focus:border-cyan-500/50 font-bold"
                  />
                  <Globe size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" />
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => runGrounding('search')}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Search size={18} /> Search Grounding
                </button>
                <button 
                  onClick={() => runGrounding('maps')}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <MapPin size={18} /> Maps Grounding
                </button>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
             <div className="flex flex-col items-center justify-center py-10 space-y-10">
                <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-1000 ${
                  isLiveActive ? 'bg-rose-500 animate-pulse shadow-[0_0_60px_rgba(244,63,94,0.4)]' : 'bg-cyan-500 shadow-xl shadow-cyan-500/20'
                }`}>
                  <Mic size={56} className="text-white" />
                </div>
                <div className="text-center space-y-3">
                   <h3 className="text-2xl font-black text-white">{isLiveActive ? 'Streaming Context' : 'Native Audio Lab'}</h3>
                   <p className="text-sm text-slate-500 max-w-xs font-medium">Real-time low-latency financial advisor conversation.</p>
                </div>
                <button
                  onClick={isLiveActive ? stopLive : startLive}
                  className={`w-full py-5 rounded-[2rem] font-black text-white transition-all text-sm uppercase tracking-widest ${
                    isLiveActive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-cyan-600 hover:bg-cyan-500 shadow-2xl shadow-cyan-900/40'
                  }`}
                >
                  {isLiveActive ? 'Terminate Uplink' : 'Initialize Uplink'}
                </button>
             </div>
          )}

          {/* Media Vault (Shared) */}
          {(activeTab === 'intelligence' || activeTab === 'creative') && (
            <div className="pt-8 border-t border-slate-800/50">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-6">Media Vault</label>
               <div className="flex gap-6 items-center">
                  <label className="cursor-pointer bg-slate-800/20 hover:bg-slate-800/40 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-700 flex-1 flex flex-col items-center gap-3 transition-all">
                     <Upload size={32} className="text-slate-500" />
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Import Asset</span>
                     <input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={handleFileSelect} />
                  </label>
                  {base64File && (
                    <div className="relative w-32 h-32 rounded-[2rem] overflow-hidden border border-slate-700 shadow-xl">
                       {selectedFile?.type.startsWith('video') ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950">
                            <FileVideo className="text-cyan-500" size={32} />
                          </div>
                       ) : selectedFile?.type.startsWith('audio') ? (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950">
                          <FileAudio className="text-purple-500" size={32} />
                        </div>
                       ) : (
                          <img src={base64File} className="w-full h-full object-cover" />
                       )}
                       <button 
                        onClick={() => { setSelectedFile(null); setBase64File(null); }}
                        className="absolute top-2 right-2 p-1.5 bg-slate-900/90 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>

        {/* OUTPUT COLUMN */}
        <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-800/50 shadow-2xl flex flex-col min-h-[600px] overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" /> Neural Output
            </h3>
            {result?.type === 'text' && (
              <button 
                onClick={speakResult}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-cyan-400 transition-all"
                title="Speak Output"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                 <div className="relative">
                   <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                   <Brain className="absolute inset-0 m-auto text-cyan-500 animate-pulse" size={32} />
                 </div>
                 <div>
                   <p className="text-white font-black uppercase text-[10px] tracking-widest">Processing Modalities</p>
                   <p className="text-slate-500 text-xs mt-2 italic">Synthesizing multi-modal response...</p>
                 </div>
              </div>
            )}

            {!loading && result?.type === 'text' && (
              <div className="bg-slate-950/40 p-8 rounded-[2rem] border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
                {result.content}
              </div>
            )}

            {!loading && result?.type === 'image' && (
              <div className="rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl group relative">
                 <img src={result.url} className="w-full" />
                 <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-950 to-transparent">
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Flash Image Rendering Complete</p>
                 </div>
              </div>
            )}

            {!loading && result?.type === 'video' && (
              <div className="space-y-4">
                 <div className="rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
                    <video src={result.url} controls autoPlay className="w-full" />
                 </div>
                 <div className="flex justify-between items-center px-4">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Veo 3.1 Neural Asset</span>
                    <a href={result.url} download className="flex items-center gap-2 text-xs font-black text-white bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-700 transition-all">
                      Save Video
                    </a>
                 </div>
              </div>
            )}

            {!loading && groundingSources.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Globe size={14} /> Citations & Grounding
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {groundingSources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" className="p-5 bg-slate-950/40 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all text-xs font-bold text-slate-300 flex items-center justify-between group">
                      <div className="flex items-center gap-4 truncate">
                        <div className="p-2 bg-slate-900 rounded-lg text-cyan-500">
                          <Search size={14} />
                        </div>
                        <span className="truncate">{s.title || s.uri}</span>
                      </div>
                      <Send size={14} className="text-slate-600 group-hover:text-cyan-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {!loading && activeTab === 'live' && transcriptions.length > 0 && (
              <div className="space-y-4 max-h-[400px]">
                {transcriptions.map((t, i) => (
                   <div key={i} className={`p-5 rounded-2xl border text-xs font-bold leading-relaxed ${
                     t.startsWith('AI:') ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-200 ml-4' : 'bg-slate-800/50 border-slate-700 text-slate-400 mr-4'
                   }`}>
                      {t}
                   </div>
                ))}
              </div>
            )}

            {!loading && !result && !isLiveActive && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-8 opacity-20 group">
                 <div className="relative">
                    <Brain size={120} className="text-slate-400 group-hover:scale-110 transition-transform duration-700" />
                    <Settings className="absolute -bottom-2 -right-2 text-slate-500 animate-spin-slow" size={40} />
                 </div>
                 <div className="space-y-2">
                   <p className="text-white font-black uppercase text-xs tracking-[0.3em]">Awaiting Instruction</p>
                   <p className="text-slate-500 text-[10px] font-bold uppercase">Initialize a modality from the command grid</p>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AILabView;
