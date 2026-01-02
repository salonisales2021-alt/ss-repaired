
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { SupportTicket, TicketMessage, TicketStatus } from '../../types';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";

export const Helpdesk: React.FC = () => {
    const { user } = useApp();
    const { t } = useLanguage();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);
    
    // AI Summary State
    const [summary, setSummary] = useState<string | null>(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const replyInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    useEffect(() => {
        scrollToBottom();
        setSummary(null); // Reset summary when ticket changes
    }, [selectedTicket?.id]);

    const loadTickets = async () => {
        setLoading(true);
        const data = await db.getTickets();
        setTickets(data);
        
        if (selectedTicket) {
            const updated = data.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }
        setLoading(false);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSummarize = async () => {
        if (!selectedTicket) return;
        setIsSummarizing(true);
        setSummary(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const chatHistory = selectedTicket.messages.map(m => `${m.senderName}: ${m.message}`).join('\n');
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Summarize the following customer support chat history into 3 bullet points:
                1. The core issue.
                2. What has been done so far.
                3. The next logical step.
                
                History:
                ${chatHistory}`
            });

            if (response.text) setSummary(response.text);
        } catch (error) {
            console.error(error);
            setSummary("AI failed to summarize this thread. Please read the history manually.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTicket || !replyText.trim()) return;

        const msg: TicketMessage = {
            id: `m-${Date.now()}`,
            senderId: 'SUPPORT',
            senderName: user?.fullName || 'Support Team',
            message: replyText,
            timestamp: new Date().toISOString()
        };

        await db.addTicketMessage(selectedTicket.id, msg);
        setReplyText('');
        await loadTickets();
    };

    const handleStatusChange = async (status: TicketStatus) => {
        if (!selectedTicket) return;
        await db.updateTicket(selectedTicket.id, { status });
        await loadTickets();
    };

    const insertFormat = (symbol: string) => {
        const textarea = replyInputRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = replyText;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        const newText = `${before}${symbol}${selected}${symbol}${after}`;
        setReplyText(newText);
        
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + symbol.length, end + symbol.length);
        }, 0);
    };

    const renderMessage = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
            return part;
        });
    };

    const filteredTickets = tickets.filter(t => filterStatus === 'ALL' || t.status === filterStatus);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-orange-100 text-orange-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'RESOLVED': return 'bg-green-100 text-green-700';
            case 'CLOSED': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white animate-fade-in overflow-hidden">
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col bg-gray-50 h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Support Inbox</h2>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${
                                    filterStatus === status 
                                    ? 'bg-rani-500 text-white border-rani-500' 
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                {status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                    ) : filteredTickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">No tickets found.</div>
                    ) : (
                        filteredTickets.map(ticket => (
                            <div 
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-white transition-colors ${selectedTicket?.id === ticket.id ? 'bg-white border-l-4 border-l-rani-500 shadow-sm' : 'bg-transparent border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-bold text-sm ${selectedTicket?.id === ticket.id ? 'text-rani-600' : 'text-gray-800'} line-clamp-1`}>{ticket.subject}</h4>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${getStatusColor(ticket.status)}`}>
                                        {ticket.status === 'IN_PROGRESS' ? 'WIP' : ticket.status}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-gray-700">{ticket.userName}</p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2 italic">
                                    "{ticket.messages[ticket.messages.length - 1]?.message}"
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Detail View */}
            <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
                {selectedTicket ? (
                    <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-gray-800">{selectedTicket.subject}</h3>
                                <div className="text-xs text-gray-500 flex gap-2 mt-1">
                                    <span>User: <span className="font-bold">{selectedTicket.userName}</span></span>
                                    {selectedTicket.orderId && <span>Order: <span className="font-mono">{selectedTicket.orderId}</span></span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Button size="sm" variant="outline" onClick={handleSummarize} disabled={isSummarizing}>
                                    {isSummarizing ? t('helpdesk.summarizing') : `✨ ${t('helpdesk.summarize')}`}
                                </Button>
                                <select 
                                    className="border border-gray-300 rounded px-2 py-1 text-xs bg-white outline-none focus:border-rani-500"
                                    value={selectedTicket.status}
                                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                                >
                                    <option value="OPEN">Open</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="CLOSED">Closed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* AI Summary Box */}
                            {summary && (
                                <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg mb-6 animate-fade-in shadow-sm">
                                    <h4 className="text-xs font-black text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="text-sm">✨</span> {t('helpdesk.summaryTitle')}
                                    </h4>
                                    <div className="text-sm text-purple-900 whitespace-pre-line leading-relaxed">
                                        {summary}
                                    </div>
                                </div>
                            )}

                            {selectedTicket.messages.map((msg) => {
                                const isSupport = msg.senderId === 'SUPPORT' || msg.senderId === 'ADMIN';
                                return (
                                    <div key={msg.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] flex flex-col ${isSupport ? 'items-end' : 'items-start'}`}>
                                            <div className={`
                                                px-4 py-3 rounded-lg text-sm shadow-sm
                                                ${isSupport ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-bl-none'}
                                            `}>
                                                {renderMessage(msg.message)}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                {isSupport ? 'Support' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="flex gap-2 mb-2">
                                <button type="button" onClick={() => insertFormat('**')} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs font-bold w-8 text-gray-700" title="Bold">B</button>
                                <button type="button" onClick={() => insertFormat('*')} className="p-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xs italic w-8 font-serif text-gray-700" title="Italic">I</button>
                            </div>
                            <form onSubmit={handleReply} className="flex gap-2 items-start">
                                <textarea 
                                    ref={replyInputRef}
                                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-rani-500 outline-none shadow-inner resize-none h-16 bg-white"
                                    placeholder="Type reply... (Markdown supported)"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleReply(e);
                                        }
                                    }}
                                />
                                <Button disabled={!replyText.trim()} className="h-16">Send</Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="font-bold uppercase tracking-widest text-xs">Select a ticket to begin</p>
                    </div>
                )}
            </div>
        </div>
    );
};
