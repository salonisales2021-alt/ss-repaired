

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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
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
                                    <h4