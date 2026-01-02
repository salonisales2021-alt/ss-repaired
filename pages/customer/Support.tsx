import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { SupportTicket, TicketMessage } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Navigate } from 'react-router-dom';

export const Support: React.FC = () => {
    const { user } = useApp();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [view, setView] = useState<'LIST' | 'CREATE' | 'DETAIL'>('LIST');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [newSubject, setNewSubject] = useState('');
    const [newCategory, setNewCategory] = useState<SupportTicket['category']>('OTHER');
    const [newOrderId, setNewOrderId] = useState('');
    const [newMessage, setNewMessage] = useState('');

    // Chat State
    const [replyText, setReplyText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (user) loadTickets();
    }, [user]);

    useEffect(() => {
        if (view === 'DETAIL') {
            scrollToBottom();
        }
    }, [view, selectedTicket?.messages]);

    const loadTickets = async () => {
        if (!user) return;
        setLoading(true);
        const data = await db.getTickets(user.id);
        setTickets(data);
        setLoading(false);
        
        // Refresh selected ticket if open
        if (selectedTicket) {
            const updated = data.find(t => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        const ticket: SupportTicket = {
            id: `t-${Date.now()}`,
            userId: user.id,
            userName: user.businessName || user.fullName,
            orderId: newOrderId || undefined,
            subject: newSubject,
            category: newCategory,
            status: 'OPEN',
            priority: 'MEDIUM',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: `m-${Date.now()}`,
                    senderId: user.id,
                    senderName: user.businessName || user.fullName,
                    message: newMessage,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        await db.createTicket(ticket);
        await loadTickets();
        
        // Reset form
        setNewSubject('');
        setNewCategory('OTHER');
        setNewOrderId('');
        setNewMessage('');
        setView('LIST');
        setLoading(false);
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedTicket || !replyText.trim()) return;

        const msg: TicketMessage = {
            id: `m-${Date.now()}`,
            senderId: user.id,
            senderName: user.businessName || user.fullName,
            message: replyText,
            timestamp: new Date().toISOString()
        };

        await db.addTicketMessage(selectedTicket.id, msg);
        setReplyText('');
        await loadTickets();
    };

    if (!user) return <Navigate to="/login" />;

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
        <div className="bg-gray-50 min-h-screen py-8 font-sans">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Support Center</h1>
                        <p className="text-sm text-gray-500">Track complaints and get help with your orders.</p>
                    </div>
                    {view === 'LIST' && (
                        <Button onClick={() => setView('CREATE')}>
                            + Raise Ticket
                        </Button>
                    )}
                    {view !== 'LIST' && (
                        <Button variant="outline" onClick={() => setView('LIST')}>
                            ← Back to Tickets
                        </Button>
                    )}
                </div>

                {/* --- CREATE VIEW --- */}
                {view === 'CREATE' && (
                    <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto animate-fade-in">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Submit a Request</h2>
                        <form onSubmit={handleSubmitTicket} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Issue Category</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 bg-white"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value as any)}
                                >
                                    <option value="ORDER_ISSUE">Order Issue (Damaged/Missing)</option>
                                    <option value="PAYMENT">Payment & Billing</option>
                                    <option value="PRODUCT_QUERY">Product Inquiry</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <Input 
                                label="Subject" 
                                placeholder="Brief summary of the issue..." 
                                required
                                value={newSubject}
                                onChange={(e) => setNewSubject(e.target.value)}
                            />

                            <Input 
                                label="Order ID (Optional)" 
                                placeholder="e.g. ord-123" 
                                value={newOrderId}
                                onChange={(e) => setNewOrderId(e.target.value)}
                            />

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 h-32"
                                    placeholder="Please provide details about your issue..."
                                    required
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                            </div>

                            <Button fullWidth disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Ticket'}
                            </Button>
                        </form>
                    </div>
                )}

                {/* --- LIST VIEW --- */}
                {view === 'LIST' && (
                    <div className="space-y-4 animate-fade-in">
                        {loading && tickets.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">Loading tickets...</div>
                        ) : tickets.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-lg border border-dashed border-gray-300">
                                <div className="text-4xl mb-4">🎫</div>
                                <h3 className="text-lg font-bold text-gray-800">No tickets found</h3>
                                <p className="text-gray-500 mb-4">Need help? Raise a ticket regarding your orders.</p>
                                <Button onClick={() => setView('CREATE')}>Create Your First Ticket</Button>
                            </div>
                        ) : (
                            tickets.map(ticket => (
                                <div 
                                    key={ticket.id} 
                                    onClick={() => { setSelectedTicket(ticket); setView('DETAIL'); }}
                                    className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-lg text-gray-800 group-hover:text-rani-600 transition-colors">{ticket.subject}</h3>
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Ticket #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">
                                            Last update: {new Date(ticket.updatedAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end mt-4">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {ticket.category.replace('_', ' ')}
                                        </span>
                                        {ticket.orderId && (
                                            <span className="text-xs font-mono text-gray-500">Ref: {ticket.orderId}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* --- DETAIL VIEW --- */}
                {view === 'DETAIL' && selectedTicket && (
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px] animate-fade-in">
                        {/* Detail Header */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold text-gray-800">{selectedTicket.subject}</h2>
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${getStatusColor(selectedTicket.status)}`}>
                                    {selectedTicket.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500">
                                <span>ID: #{selectedTicket.id}</span>
                                <span>Category: {selectedTicket.category.replace('_', ' ')}</span>
                                {selectedTicket.orderId && <span>Order: {selectedTicket.orderId}</span>}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 space-y-4">
                            {selectedTicket.messages.map((msg) => {
                                const isMe = msg.senderId === user.id;
                                const isSystem = msg.senderId === 'SUPPORT' || msg.senderId === 'ADMIN';
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            <div className={`
                                                px-4 py-3 rounded-lg text-sm shadow-sm
                                                ${isMe ? 'bg-rani-500 text-white rounded-br-none' : isSystem ? 'bg-white border border-gray-200 text-gray-800 rounded-bl-none' : 'bg-gray-200 text-gray-800'}
                                            `}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1 px-1">
                                                {isMe ? 'You' : msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply Input */}
                        {selectedTicket.status !== 'CLOSED' ? (
                            <form onSubmit={handleReply} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-rani-500 outline-none"
                                    placeholder="Type your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <button 
                                    type="submit"
                                    className="bg-rani-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-rani-600 transition-colors"
                                    disabled={!replyText.trim()}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 bg-gray-100 text-center text-sm text-gray-500 border-t border-gray-200">
                                This ticket has been closed. Please raise a new ticket for further assistance.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};