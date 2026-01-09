

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { db, parseAIJson } from '../../services/db';
import { TransactionType, VisitLog, User, Order, UserRole } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { Input } from '../../components/Input';

type Tab = 'CLIENTS' | 'COMMISSIONS' | 'SMART_ROUTE';

interface BeatPlanItem {
    clientId: string;
    clientName: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    visitType: 'PAYMENT_COLLECTION' | 'SALES_VISIT' | 'RELATIONSHIP';
    reason: string;
    location: string;
}

export const AgentDashboard: React.FC = () => {
    const { user, selectClient, registerUser } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('CLIENTS');
    const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
    const [myClients, setMyClients] = useState<User[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    
    // Beat Plan State
    const [beatPlan, setBeatPlan] = useState<BeatPlanItem[]>([]);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

    // Modals
    const [showCollectModal, setShowCollectModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [selectedClientForAction, setSelectedClientForAction] = useState<User | null>(null);

    // Form States
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [paymentRef, setPaymentRef] = useState('');
    const [visitPurpose, setVisitPurpose] = useState<'ORDER_COLLECTION' | 'STOCK_CHECK' | 'COURTESY_VISIT'>('ORDER_COLLECTION');
    const [visitNotes, setVisitNotes] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);

    // New Client Form
    const [newClientData, setNewClientData] = useState({
        businessName: '',
        fullName: '',
        mobile: '',
        email: ''
    });

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            const [logs, allUsers, allOrders] = await Promise.all([
                db.getVisitLogs(user.id),
                db.getUsers(),
                db.getAllOrders()
            ]);
            
            // Filter clients assigned to this agent
            const clients = allUsers.filter(u => u.assignedAgentId === user.id);
            setVisitLogs(logs);
            setMyClients(clients);
            
            const clientIds = clients.map(c => c.id);
            const relatedOrders = allOrders.filter(o => clientIds.includes(o.userId));
            setOrders(relatedOrders);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };

    if (!user || (user.role !== 'AGENT')) {
        return <div className="p-8 text-center">Access Restricted. Agents only. <Button onClick={() => navigate('/login')} variant="text">Login</Button></div>;
    }

    // --- Commission Logic ---
    const COMM_RATE = 0.02;
    const commissions = orders.map(order => ({
        orderId: order.id,
        date: order.createdAt,
        clientName: order.userBusinessName,
        orderValue: order.totalAmount,
        commission: Math.round(order.totalAmount * COMM_RATE),
        status: order.status === 'DELIVERED' ? 'PAID' : 'PENDING'
    }));

    const totalEarnings = commissions.filter(c => c.status === 'PAID').reduce((sum, c) => sum + c.commission, 0);

    const filteredClients = myClients.filter(c => 
        c.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- AI BEAT PLAN ---
    const generateBeatPlan = async () => {
        setIsGeneratingPlan(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            const clientContext = myClients.map(c => {
                const lastOrder = orders.find(o => o.userId === c.id);
                const lastVisit = visitLogs.find(l => l.clientId === c.id);
                return {
                    id: c.id,
                    name: c.businessName || c.fullName,
                    outstanding: c.outstandingDues || 0,
                    lastOrderDate: lastOrder?.createdAt || '2023-01-01',
                    lastVisitDate: lastVisit?.date || '2023-01-01',
                };
            });

            const prompt = `Create an optimal daily visit plan for an agent. Clients Data: ${JSON.stringify(clientContext)}. Prioritize high outstanding dues for payment collection. Return JSON only.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                clientId: { type: Type.STRING },
                                priority: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                                visitType: { type: Type.STRING, enum: ["PAYMENT_COLLECTION", "SALES_VISIT", "RELATIONSHIP"] },
                                reason: { type: Type.STRING },
                                location: { type: Type.STRING }
                            },
                            required: ["clientId", "priority", "visitType", "reason"]
                        }
                    },
                },
            });

            const plan = parseAIJson(response.text || '', []);
            const hydratedPlan = plan.map((item: any) => ({
                ...item,
                clientName: myClients.find(c => c.id === item.clientId)?.businessName || 'Unknown'
            }));

            setBeatPlan(hydratedPlan);
        } catch (error) {
            console.error(error);
            alert("Failed to generate plan.");
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleShopForClient = (client: any) => {
        selectClient(client);
        navigate('/');
    };

    const openCollectModal = (client: User) => {
        setSelectedClientForAction(client);
        setShowCollectModal(true);
        setAmount(''); setPaymentMode('Cash'); setPaymentRef('');
    };

    const openVisitModal = (client: User) => {
        setSelectedClientForAction(client);
        setShowVisitModal(true);
        setVisitNotes(''); setVisitPurpose('ORDER_COLLECTION');
    };

    const submitCollection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientForAction || !amount) return;
        setLoadingAction(true);

        const amt = Number(amount);
        await db.recordTransaction({
            id: `tx-${Date.now()}`,
            userId: selectedClientForAction.id,
            date: new Date().toISOString(),
            type: 'PAYMENT',
            amount: amt,
            description: `Field Collection by ${user.fullName} (${paymentMode})`,
            referenceId: paymentRef || 'CASH',
            createdBy: user.id
        });

        await db.logVisit({
            id: `vl-${Date.now()}`,
            agentId: user.id,
            agentName: user.fullName,
            clientId: selectedClientForAction.id,
            clientName: selectedClientForAction.businessName || selectedClientForAction.fullName,
            date: new Date().toISOString(),
            purpose: 'PAYMENT_COLLECTION',
            amountCollected: amt,
            notes: `Collected ₹${amt} via ${paymentMode}. Ref: ${paymentRef}`,
            location: 'Client Shop'
        });

        alert("Payment Recorded Successfully");
        setShowCollectModal(false);
        setLoadingAction(false);
        loadData();
    };

    const submitVisit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientForAction) return;
        setLoadingAction(true);

        await db.logVisit({
            id: `vl-${Date.now()}`,
            agentId: user.id,
            agentName: user.fullName,
            clientId: selectedClientForAction.id,
            clientName: selectedClientForAction.businessName || selectedClientForAction.fullName,
            date: new Date().toISOString(),
            purpose: visitPurpose,
            notes: visitNotes,
            location: 'Client Shop'
        });

        alert("Visit Logged Successfully");
        setShowVisitModal(false);
        setLoadingAction(false);
        loadData();
    };

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction(true);
        try {
            const newUser: User = {
                id: `u-${Date.now()}`,
                email: newClientData.email || `client-${Date.now()}@temp.com`,
                fullName: newClientData.fullName,
                businessName: newClientData.businessName,
                mobile: newClientData.mobile,
                role: UserRole.RETAILER,
                isApproved: true,
                isPreBookApproved: false,
                creditLimit: 0,
                outstandingDues: 0,
                assignedAgentId: user.id, // Auto-link to self
                wishlist: []
            };

            // Use mobile as initial password for simplicity in field
            const password = newClientData.mobile || 'Saloni123';
            
            const result = await registerUser(newUser, password);
            if (result.success) {
                alert(`Client Registered! Password is: ${password}`);
                setShowAddClientModal(false);
                setNewClientData({ businessName: '', fullName: '', mobile: '', email: '' });
                loadData();
            } else {
                alert(result.error || "Registration failed.");
            }
        } catch (err) {
            alert("Error creating client.");
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans pb-20">
            <header className="bg-white text-luxury-black p-4 shadow-sm border-b border-rani-100 sticky top-0 z-20">
                <div className="container mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold font-script text-rani-500">{t('agent.dashboard')}</h1>
                        <p className="text-xs text-gray-400">Welcome, {user.fullName} ({user.role})</p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>Logout</Button>
                </div>
            </header>

            <main className="container mx-auto p-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded shadow-sm border-l-4 border-rani-500">
                        <h3 className="text-gray-500 text-xs uppercase font-bold">Total Clients</h3>
                        <p className="text-3xl font-bold text-luxury-black">{myClients.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow-sm border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-xs uppercase font-bold">Total Earnings</h3>
                        <p className="text-3xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded shadow-sm border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-xs uppercase font-bold">Visits This Week</h3>
                        <p className="text-3xl font-bold text-blue-600">{visitLogs.length}</p>
                    </div>
                </div>

                <div className="flex border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('CLIENTS')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'CLIENTS' ? 'border-rani-500 text-rani-600' : 'border-transparent text-gray-500'}`}>{t('agent.myClients')}</button>
                    <button onClick={() => setActiveTab('SMART_ROUTE')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'SMART_ROUTE' ? 'border-rani-500 text-rani-600' : 'border-transparent text-gray-500'}`}>Smart Route</button>
                    <button onClick={() => setActiveTab('COMMISSIONS')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'COMMISSIONS' ? 'border-rani-500 text-rani-600' : 'border-transparent text-gray-500'}`}>{t('agent.commissions')}</button>
                </div>

                {loadingData ? (
                    <div className="py-20 text-center text-gray-400">Loading partner data...</div>
                ) : (
                    <>
                    {activeTab === 'CLIENTS' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                            <div className="lg:col-span-2 bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex justify-between gap-4 flex-wrap">
                                    <h2 className="text-lg font-bold">Client Management</h2>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder="Search..." className="px-4 py-2 border rounded text-sm outline-none focus:border-rani-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                        <Button size="sm" onClick={() => setShowAddClientModal(true)}>+ New</Button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                            <tr><th className="p-4">Business Name</th><th className="p-4">Outstanding</th><th className="p-4 text-right">Actions</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredClients.map((client) => (
                                                <tr key={client.id} className="hover:bg-gray-50">
                                                    <td className="p-4"><div className="font-bold text-gray-800">{client.businessName}</div><div className="text-xs text-gray-500">{client.fullName}</div></td>
                                                    <td className="p-4"><div className={`font-bold ${client.outstandingDues && client.outstandingDues > 0 ? 'text-red-600' : 'text-green-600'}`}>₹{client.outstandingDues?.toLocaleString() || 0}</div></td>
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button size="sm" variant="secondary" className="text-xs px-2 py-1" onClick={() => openCollectModal(client)}>Collect ₹</Button>
                                                            <Button size="sm" variant="outline" className="text-xs px-2 py-1" onClick={() => openVisitModal(client)}>Visit</Button>
                                                            <Button size="sm" className="text-xs px-2 py-1" onClick={() => handleShopForClient(client)}>Shop</Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-white rounded shadow-sm border border-gray-200 p-6 h-fit">
                                <h3 className="font-bold text-lg mb-4 text-gray-800">Recent Field Activity</h3>
                                <div className="space-y-4">
                                    {visitLogs.slice(0, 5).map(log => (
                                        <div key={log.id} className="border-l-2 border-rani-100 pl-4 py-1">
                                            <p className="text-[10px] text-gray-400">{new Date(log.date).toLocaleDateString()}</p>
                                            <p className="text-sm font-bold text-gray-800">{log.clientName}</p>
                                            <p className="text-xs text-gray-500">{log.purpose.replace('_', ' ')}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'COMMISSIONS' && (
                        <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                                    <tr><th className="p-4">Date</th><th className="p-4">Client</th><th className="p-4">Order Value</th><th className="p-4">Comm. (2%)</th><th className="p-4 text-right">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {commissions.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="p-4 text-gray-500">{new Date(c.date).toLocaleDateString()}</td>
                                            <td className="p-4 font-bold">{c.clientName}</td>
                                            <td className="p-4">₹{c.orderValue.toLocaleString()}</td>
                                            <td className="p-4 font-bold text-green-600">₹{c.commission.toLocaleString()}</td>
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${c.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'SMART_ROUTE' && (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 rounded-2xl text-white mb-8 shadow-lg">
                                <h2 className="text-2xl font-bold mb-2">AI Route Optimizer</h2>
                                <p className="text-indigo-100 text-sm mb-6">Generate the most efficient daily plan based on geography and outstanding dues.</p>
                                <Button onClick={generateBeatPlan} disabled={isGeneratingPlan} className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold border-none">
                                    {isGeneratingPlan ? 'Calculating Optimal Route...' : 'Generate Today\'s Plan'}
                                </Button>
                            </div>

                            {beatPlan.length > 0 && (
                                <div className="space-y-4">
                                    {beatPlan.map((stop, idx) => (
                                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{idx + 1}</div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{stop.clientName}</h4>
                                                <p className="text-xs text-gray-500">{stop.reason}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${stop.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{stop.priority} Priority</span>
                                                <p className="text-[10px] text-gray-400 mt-1">{stop.location}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    </>
                )}
            </main>

            {/* MODALS */}
            {showCollectModal && selectedClientForAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Collect Payment</h3>
                        <form onSubmit={submitCollection} className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase">Amount (₹)</label><input type="number" className="w-full border p-2 rounded" required value={amount} onChange={e => setAmount(e.target.value)} /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase">Mode</label><select className="w-full border p-2 rounded" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}><option>Cash</option><option>Cheque</option><option>UPI / Online</option></select></div>
                            <div className="flex gap-2 pt-2"><Button fullWidth disabled={loadingAction}>Save</Button><Button type="button" variant="outline" onClick={() => setShowCollectModal(false)}>Cancel</Button></div>
                        </form>
                    </div>
                </div>
            )}
            {showVisitModal && selectedClientForAction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Log Visit</h3>
                        <form onSubmit={submitVisit} className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase">Purpose</label><select className="w-full border p-2 rounded" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value as any)}><option value="ORDER_COLLECTION">Order Collection</option><option value="STOCK_CHECK">Stock Check</option><option value="COURTESY_VISIT">Courtesy Visit</option></select></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase">Notes</label><textarea className="w-full border p-2 rounded h-24" value={visitNotes} onChange={e => setVisitNotes(e.target.value)} required></textarea></div>
                            <div className="flex gap-2 pt-2"><Button fullWidth disabled={loadingAction}>Log Visit</Button><Button type="button" variant="outline" onClick={() => setShowVisitModal(false)}>Cancel</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {showAddClientModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-bold mb-4">Register New Retailer</h3>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <Input label="Shop / Business Name" required value={newClientData.businessName} onChange={e => setNewClientData({...newClientData, businessName: e.target.value})} />
                            <Input label="Owner Name" required value={newClientData.fullName} onChange={e => setNewClientData({...newClientData, fullName: e.target.value})} />
                            <Input label="Mobile Number" required value={newClientData.mobile} onChange={e => setNewClientData({...newClientData, mobile: e.target.value})} />
                            <Input label="Email (Optional)" type="email" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} />
                            
                            <div className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                New user will be linked to you automatically. Password will be set to their mobile number.
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button fullWidth disabled={loadingAction}>Create Account</Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddClientModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};