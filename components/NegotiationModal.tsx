
// ... (imports remain same)
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";
import { handleAiError, parseAIJson } from '../services/db';

interface NegotiationModalProps {
  cartTotal: number;
  onApplyDiscount: (percent: number) => void;
  onClose: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({ cartTotal, onApplyDiscount, onClose }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hello! I'm Saloni's automated bulk sales agent. I see your cart is ₹" + cartTotal.toLocaleString() + ". I'm authorized to offer a small flexibility for volume orders. What are you looking for?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a B2B sales manager for Saloni Sales. A retailer wants to negotiate a discount on their cart of ₹${cartTotal}.
      History: ${JSON.stringify(messages)}
      Latest Request: "${userText}"
      
      RULES:
      1. MAXIMUM discount you can give is 3%. ABSOLUTELY NO HIGHER.
      2. If they ask for more than 3%, refuse politely and state that factory margins are already thin. Offer 1-2% instead.
      3. CRITICAL DISCLOSURE: If you agree on any discount (even 1%), you MUST explicitly state that: "Accepting this discounted rate means only the 'Pay Now' (Razorpay/Online) option will be available at checkout. Ledger/Credit options will be disabled for this order."
      4. If you agree on a discount, state the percentage clearly (e.g. "I can give you 3%").
      5. Return JSON: { "message": "your spoken text", "discountPercent": 0-3 }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const res = parseAIJson(response.text, { message: "Let me check...", discountPercent: 0 } as any);
      setMessages(prev => [...prev, { role: 'model', text: res.message }]);
      
      if (res.discountPercent > 0) {
          setTimeout(() => {
              onApplyDiscount(res.discountPercent);
              onClose();
          }, 4500); // Give user time to read the disclosure
      }
    } catch (e) {
      await handleAiError(e);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the accounts desk. Let's try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-[500px] animate-fade-in-up">
        <div className="bg-rani-500 p-5 flex justify-between items-center text-white">
          <div>
            <h3 className="font-bold text-lg leading-tight">{t('cart.negotiationTitle')}</h3>
            <p className="text-[10px] text-rani-100 uppercase tracking-widest font-black">Authorized Sales Desk</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full">✕</button>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === 'user' ? 'bg-rani-500 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-[10px] text-gray-400 italic">Checking with production manager...</div>}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-rani-500/20" 
              placeholder={t('cart.negotiationPlaceholder')}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} className="rounded-xl px-6">Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};
