
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../services/db';
import { SupportTicket, TicketMessage, TicketStatus } from '../../types';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";
import { getGeminiKey, handleAiError } from '../../services/db';

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
            const apiKey = getGeminiKey();
            if (!apiKey) throw new Error("API Key missing");

            const ai = new GoogleGenAI({ apiKey });
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
            await handleAiError(error);
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
                                    ? 'bg-rani-50 text-white border-rani-500' 
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
                                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{ticket.subject}</h4>
                                    <span className="text-[10px] text-gray-400 shrink-0">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500 truncate max-w-[120px]">{ticket.userName}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${getStatusColor(ticket.status)}`}>
                                        {ticket.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Detail View */}
            <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
                {selectedTicket ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{selectedTicket.subject}</h2>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>#{selectedTicket.id}</span>
                                    <span>•</span>
                                    <span>{selectedTicket.category.replace('_', ' ')}</span>
                                    {selectedTicket.orderId && <span>• Order: {selectedTicket.orderId}</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing}>
                                    {isSummarizing ? 'AI Summarizing...' : '✨ Summarize'}
                                </Button>
                                <select 
                                    className="bg-gray-50 border border-gray-200 rounded text-xs px-2 py-1 outline-none"
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

                        {/* Summary Block */}
                        {summary && (
                            <div className="bg-purple-50 p-4 border-b border-purple-100 animate-fade-in shrink-0">
                                <h4 className="text-xs font-bold text-purple-700 uppercase mb-1">AI Summary</h4>
                                <div className="text-sm text-purple-900 whitespace-pre-line">{summary}</div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-4">
                            {selectedTicket.messages.map(msg => {
                                const isAgent = msg.senderId === 'SUPPORT' || msg.senderId === 'ADMIN' || msg.senderId === user?.id;
                                return (
                                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl text-sm shadow-sm ${
                                                isAgent 
                                                ? 'bg-rani-500 text-white rounded-br-none' 
                                                : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                            }`}>
                                                {renderMessage(msg.message)}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                {isAgent ? 'Support' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                            <form onSubmit={handleReply}>
                                <div className="relative">
                                    <textarea 
                                        ref={replyInputRef}
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 resize-none h-24"
                                        placeholder="Type your reply... (Use **bold** for emphasis)"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply(e);
                                            }
                                        }}
                                    />
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <button type="button" onClick={() => insertFormat('**')} className="text-gray-400 hover:text-rani-600 font-bold" title="Bold">B</button>
                                        <Button size="sm" disabled={!replyText.trim()} className="rounded-lg h-8 px-4">Send</Button>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                                    <span>Press Enter to send</span>
                                    <span>Shift + Enter for new line</span>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-4xl">💬</div>
                        <p>Select a ticket to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
