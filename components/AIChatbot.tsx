
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../services/db';

interface Message {
    role: 'user' | 'model';
    text: string;
}

export const AIChatbot: React.FC = () => {
    const { products, user } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hello! I am your Saloni Sales assistant.' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Build context from products
            const productContext = products.slice(0, 10).map(p => `${p.name}: ₹${p.basePrice}`).join(', ');
            const prompt = `User: ${userMsg}\nContext: You are a sales assistant. Available items: ${productContext}. Answer briefly.`;
            
            const responseText = await db.ai.generateContent(prompt);
            
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Service unavailable." }]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) {
        return (
            <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-50 bg-rani-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center">
                💬
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col h-96">
            <div className="bg-rani-500 p-3 flex justify-between items-center text-white rounded-t-xl">
                <span className="font-bold">Saloni Assistant</span>
                <button onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`p-2 rounded text-sm ${msg.role === 'user' ? 'bg-rani-50 ml-auto' : 'bg-gray-100 mr-auto'}`}>
                        {msg.text}
                    </div>
                ))}
                {isTyping && <div className="text-xs text-gray-400">Typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-2 border-t">
                <input className="w-full border rounded px-2 py-1 text-sm" value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Ask..." />
            </form>
        </div>
    );
};
