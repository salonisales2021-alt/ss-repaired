
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { useApp } from '../context/AppContext';
import { Button } from './Button';
import { handleAiError } from '../services/db';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const AIChatbot: React.FC = () => {
    const { products, user } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hello! I can help you find products, check stock, or suggest designs. What are you looking for today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    const chatSessionRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const initializeChat = async () => {
        if (!process.env.API_KEY) return;

        const productContext = (products || []).slice(0, 50).map(p => 
            `- ${p.name} (${p.category}): ₹${p.basePrice}, Status: ${p.isAvailable ? 'In Stock' : 'Out of Stock'}`
        ).join('\n');

        const systemInstruction = `
            You are "Saloni", an AI sales assistant for Saloni Sales, a B2B kids wear marketplace.
            The user is: ${user?.businessName || 'Guest'}.
            Available Products:
            ${productContext}
            Guidelines: Professional, friendly, concise. Suggest real items from the list.
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatSessionRef.current = ai.chats.create({
                model: 'gemini-3-flash-preview',
                config: { systemInstruction }
            });
        } catch (err) {
            console.error("Chat Init Fail:", err);
        }
    };

    useEffect(() => {
        if (isOpen && (!chatSessionRef.current || !process.env.API_KEY)) {
            initializeChat();
        }
    }, [isOpen, products, process.env.API_KEY]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        if (!chatSessionRef.current) {
            await initializeChat();
            if (!chatSessionRef.current) {
                alert("AI initialization failed. Please ensure your API key is selected.");
                return;
            }
        }

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue('');
        setIsTyping(true);

        try {
            const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
            
            let fullResponse = '';
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of resultStream) {
                const c = chunk as GenerateContentResponse;
                if (c.text) {
                    fullResponse += c.text;
                    setMessages(prev => {
                        const newMsgs = [...prev];
                        newMsgs[newMsgs.length - 1] = { role: 'model', text: fullResponse };
                        return newMsgs;
                    });
                }
            }
        } catch (error: any) {
            const handled = await handleAiError(error);
            if (!handled) {
                setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting to the sales office. Please try again later." }]);
            }
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-rani-500 text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                <div className="absolute right-full mr-3 bg-white text-gray-800 px-3 py-1 rounded shadow-md text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Chat with AI</div>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in-up h-[500px]">
            <div className="bg-rani-500 p-4 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"><span className="font-script font-bold text-lg">S</span></div>
                    <div><h3 className="font-bold text-sm">Saloni Assistant</h3><p className="text-[10px] text-rani-100">Live B2B Support</p></div>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-rani-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>{msg.text}</div>
                    </div>
                ))}
                {isTyping && <div className="text-xs text-gray-400 italic px-2">Assistant is typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
                <input type="text" placeholder="Type message..." className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-rani-500" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                <button type="submit" disabled={!inputValue.trim() || isTyping} className="w-9 h-9 bg-rani-500 text-white rounded-full flex items-center justify-center hover:bg-rani-600 disabled:opacity-50 transition-all">➔</button>
            </form>
        </div>
    );
};
