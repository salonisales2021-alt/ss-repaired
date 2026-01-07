
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { handleAiError } from '../services/db';

// Helper decode from Live API example
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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

export const CatalogNarrator: React.FC<{ category?: string }> = ({ category }) => {
    const { products } = useApp();
    const { t } = useLanguage();
    const [isNarrating, setIsNarrating] = useState(false);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    const stopNarration = () => {
        try { audioSourceRef.current?.stop(); } catch(e) {}
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
        }
        setIsNarrating(false);
    };

    const handleNarrate = async () => {
        if (isNarrating) {
            stopNarration();
            return;
        }

        setIsNarrating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            const filteredProducts = category && category !== 'All' 
                ? products.filter(p => p.category === category)
                : products;
            
            const highlights = filteredProducts.slice(0, 5).map(p => 
                `${p.name}, priced at ₹${p.basePrice}.`
            ).join(' ');

            const introText = t('narrator.intro');
            const fullScript = `${introText} Here are highlights for the ${category || 'latest'} collection: ${highlights}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text: `Narrate concisely for a business partner: ${fullScript}` }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: { voiceName: 'Puck' },
                        },
                    },
                },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                audioContextRef.current = outputAudioContext;
                const audioBuffer = await decodeAudioData(
                    decode(base64Audio),
                    outputAudioContext,
                    24000,
                    1,
                );
                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                source.onended = () => {
                    setIsNarrating(false);
                };
                source.start();
                audioSourceRef.current = source;
            } else {
                setIsNarrating(false);
            }
        } catch (error: any) {
            const handled = await handleAiError(error);
            if (!handled) {
                alert("Narration failed. Please try again.");
            }
            setIsNarrating(false);
        }
    };

    return (
        <button 
            onClick={handleNarrate}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all shadow-sm
                ${isNarrating 
                    ? 'bg-rani-500 text-white border-rani-500 animate-pulse' 
                    : 'bg-white text-gray-700 border-gray-200 hover:border-rani-500 hover:text-rani-600'
                }
            `}
        >
            {isNarrating ? (
                <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span className="text-xs font-bold">{t('narrator.playing')}</span>
                </>
            ) : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span className="text-xs font-bold">{t('narrator.button')}</span>
                </>
            )}
        </button>
    );
};
