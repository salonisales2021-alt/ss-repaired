
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { handleAiError } from '../services/db';

// --- HELPER FUNCTIONS FOR AUDIO ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const LiveSalesAgent: React.FC = () => {
  const { products, addToCart, user } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([4, 4, 4, 4, 4, 4, 4]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Tools Definition
  const searchProductsTool: FunctionDeclaration = {
    name: 'searchProducts',
    description: 'Search for products in the catalog based on a query.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'The search term (e.g. "red frock", "cotton lehenga")' },
      },
      required: ['query'],
    },
  };

  const addToCartTool: FunctionDeclaration = {
    name: 'addToCart',
    description: 'Add a product to the user\'s shopping cart.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productName: { type: Type.STRING, description: 'The name of the product to add' },
        quantity: { type: Type.NUMBER, description: 'Quantity to add' },
      },
      required: ['productName', 'quantity'],
    },
  };

  useEffect(() => {
      let interval: any;
      if (status === 'speaking') {
          interval = setInterval(() => {
              setVisualizerHeights(prev => prev.map(() => Math.floor(Math.random() * 40) + 10));
          }, 100);
      } else {
          setVisualizerHeights([4, 4, 4, 4, 4, 4, 4]);
          clearInterval(interval);
      }
      return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
      return () => {
          stopAudio();
      };
  }, []);

  const stopAudio = () => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current.onaudioprocess = null;
    }
    if (inputSourceRef.current) {
      try { inputSourceRef.current.disconnect(); } catch (e) {}
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (outputContextRef.current && outputContextRef.current.state !== 'closed') {
      outputContextRef.current.close().catch(() => {});
    }
    activeSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    
    sessionPromiseRef.current?.then((session: any) => {
        try { session.close(); } catch(e) { console.log('Session close error', e); }
    });

    setIsActive(false);
    setStatus('idle');
  };

  const startSession = async () => {
    if (!process.env.API_KEY) {
      alert("API Key missing");
      return;
    }

    try {
      setIsActive(true);
      setStatus('connecting');

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true
      }});
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      inputSourceRef.current = source;
      
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioCtx.destination);

      const outCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputContextRef.current = outCtx;
      const outNode = outCtx.createGain();
      outputNodeRef.current = outNode;
      outNode.connect(outCtx.destination);
      nextStartTimeRef.current = outCtx.currentTime;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setStatus('listening');
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              const buffer = await decodeAudioData(
                decode(audioData),
                outputContextRef.current!,
                24000,
                1
              );
              
              const source = outputContextRef.current!.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNodeRef.current!);
              
              const now = outputContextRef.current!.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              source.start(startTime);
              nextStartTimeRef.current = startTime + buffer.duration;
              
              activeSourcesRef.current.add(source);
              source.onended = () => {
                activeSourcesRef.current.delete(source);
                if (activeSourcesRef.current.size === 0) {
                    setStatus('listening');
                }
              };
            }

            if (message.toolCall) {
               for (const fc of message.toolCall.functionCalls) {
                   let result: any = { error: "Unknown tool" };

                   if (fc.name === 'searchProducts') {
                       const query = (fc.args as any).query.toLowerCase();
                       const matches = products.filter(p => 
                           p.name.toLowerCase().includes(query) || 
                           p.category.toLowerCase().includes(query)
                       ).slice(0, 3).map(p => ({
                           name: p.name,
                           price: p.basePrice,
                           stock: p.variants.reduce((s, v) => s + v.stock, 0)
                       }));
                       result = matches.length > 0 ? matches : "No products found.";
                   }

                   if (fc.name === 'addToCart') {
                       const name = (fc.args as any).productName.toLowerCase();
                       const qty = Number((fc.args as any).quantity) || 1;
                       const product = products.find(p => p.name.toLowerCase().includes(name));
                       
                       if (product) {
                           addToCart(product, product.variants[0], qty);
                           result = { success: true, message: `Added ${qty} ${product.name} to cart.` };
                           navigate('/cart');
                       } else {
                           result = { success: false, message: "Product not found." };
                       }
                   }

                   sessionPromise.then(session => {
                       session.sendToolResponse({
                           functionResponses: {
                               id: fc.id,
                               name: fc.name,
                               response: { result }
                           }
                       });
                   });
               }
            }
            
            if (message.serverContent?.interrupted) {
                activeSourcesRef.current.forEach(s => {
                    try { s.stop(); } catch(e) {}
                });
                activeSourcesRef.current.clear();
                nextStartTimeRef.current = outputContextRef.current!.currentTime;
                setStatus('listening');
            }
          },
          onerror: async (err: any) => {
            const handled = await handleAiError(err);
            if (!handled) {
                console.error("Gemini Live Error:", err);
            }
            stopAudio();
          },
          onclose: () => {
            stopAudio();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          tools: [{ functionDeclarations: [searchProductsTool, addToCartTool] }],
          systemInstruction: `You are a helpful B2B sales assistant named Saloni. 
          You speak concisely and professionally.
          Your goal is to help the user find products and add them to their cart.
          The user is: ${user?.businessName || 'Guest'}.
          Always check stock availability using the search tool before confirming.
          If the user wants to buy something, use the addToCart tool.
          Keep responses short (under 2 sentences).
          `
        }
      });

      sessionPromiseRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const blob = createBlob(inputData);
        sessionPromise.then(session => {
            try { session.sendRealtimeInput({ media: blob }); } catch (e) {}
        });
      };

    } catch (e: any) {
      const handled = await handleAiError(e);
      if (!handled) {
          alert("Could not start live session. Check your microphone permissions.");
      }
      stopAudio();
    }
  };

  if (!user) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2`}>
        {isActive && (
            <div className="bg-luxury-black text-white p-6 rounded-2xl shadow-2xl mb-2 w-72 animate-fade-in-up border border-gray-700 shadow-rani-500/10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${status === 'listening' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-rani-500 animate-pulse shadow-lg shadow-rani-500/50'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            {status === 'connecting' && t('liveAgent.connecting')}
                            {status === 'listening' && t('liveAgent.listening')}
                            {status === 'speaking' && t('liveAgent.speaking')}
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest">LIVE</div>
                </div>
                
                <div className="flex items-center justify-center gap-1.5 h-16 mb-6">
                    {visualizerHeights.map((h, i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 bg-gradient-to-t from-rani-600 to-rani-400 rounded-full transition-all duration-150`}
                            style={{ height: `${h}px` }}
                        ></div>
                    ))}
                </div>

                <button 
                    onClick={stopAudio}
                    className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                    {t('liveAgent.disconnect')}
                </button>
            </div>
        )}

        {!isActive && (
            <button 
                onClick={startSession}
                className="w-16 h-16 bg-luxury-black text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110 border-2 border-rani-500 group relative"
                title={t('liveAgent.connect')}
            >
                <span className="absolute -inset-1 rounded-full border-2 border-rani-500 opacity-0 group-hover:opacity-100 group-hover:animate-ping"></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 group-hover:text-rani-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            </button>
        )}
    </div>
  );
};
