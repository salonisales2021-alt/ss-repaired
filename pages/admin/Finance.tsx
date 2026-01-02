
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Transaction, TransactionType, CreditRequest, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

export const Finance: React.FC = () => {
    const { users } = useApp();
    const [activeTab, setActiveTab] = useState<'LEDGER' | 'APPROVALS'>('LEDGER');
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<TransactionType>('PAYMENT');
    const [description, setDescription] = useState('');
    const [reference, setReference] = useState('');

    const [requests, setRequests] = useState<CreditRequest[]>([]);

    useEffect(() => {
        if (activeTab === 'LEDGER') loadTransactions();
        if (activeTab === 'APPROVALS') loadRequests();
    }, [activeTab]);

    const loadTransactions = async () => {
        setLoading(true);
        const data = await db.getTransactions();
        setTransactions(data);
        setLoading(false);
    };

    const loadRequests = async () => {
        setLoading(true);
        const data = await db.getCreditRequests();
        setRequests(data.filter(r => r.status === 'PENDING'));
        setLoading(false);
    };

    const handleRecord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !amount || !description) return;

        setLoading(true);
        const success = await db.recordTransaction({
            id: `tx-${Date.now()}`,
            userId: selectedUserId,
            date: new Date().toISOString(),
            type,
            amount: Number(amount),
            description,
            referenceId: reference,
            createdBy: 'ADMIN'
        });

        if (success) {
            alert("Payment/Charge Recorded and Customer Balance Updated.");
            setShowModal(false);
            setAmount(''); setDescription(''); setReference('');
            loadTransactions();
        }
        setLoading(false);
    };

    const processRequest = async (req: CreditRequest, approved: boolean) => {
        if (approved) {
            if (!confirm(`Approve credit limit increase to ₹${req.requestedLimit.toLocaleString()}?`)) return;
        }
        await db.processCreditRequest(req.id, approved ? 'APPROVED' : 'REJECTED');
        loadRequests();
    };

    const getUserName = (uid: string) => {
        const u = users.find(user => user.id === uid);
        return u ? (u.businessName || u.fullName) : 'Unknown Partner';
    };

    const filteredTx = transactions.filter(t => 
        t.id.includes(searchTerm) || 
        getUserName(t.userId).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">B2B Financial Desk</h1>
                    <p className="text-sm text-gray-500">Record field collections, issue credits, and audit ledger entries.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={activeTab === 'LEDGER' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('LEDGER')}>Transaction Log</Button>
                    <Button variant={activeTab === 'APPROVALS' ? 'primary' : 'outline'} size="sm" onClick={() => setActiveTab('APPROVALS')}>
                        Limit Requests {requests.length > 0 && `(${requests.length})`}
                    </Button>
                </div>
            </div>

            {activeTab === 'LEDGER' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                placeholder="Filter ledger..." 
                                className="px-4 py-2 border rounded-lg text-sm w-64 outline-none focus:border-rani-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button size="sm" onClick={() => setShowModal(true)}>+ Record Transaction</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="p-4">Posting Date</th>
                                    <th className="p-4">Partner Entity</th>
                                    <th className="p-4">Transaction Type</th>
                                    <th className="p-4">Description</th>
                                    <th className="p-4 text-right">Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTx.map(tx => {
                                    const isDebit = tx.type === 'INVOICE' || tx.type === 'DEBIT_NOTE';
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-gray-500 font-mono text-xs">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                {getUserName(tx.userId)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase border ${
                                                    tx.type === 'PAYMENT' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-600 italic text-xs">
                                                {tx.description} {tx.referenceId && `[Ref: ${tx.referenceId}]`}
                                            </td>
                                            <td className={`p-4 text-right font-black ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                                                {isDebit ? '+' : '-'}{tx.amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredTx.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records available</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'APPROVALS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    {requests.length === 0 ? (
                        <div className="col-span-2 text-center py-20 text-gray-400 font-bold uppercase tracking-widest border-2 border-dashed rounded-xl">
                            All credit requests processed
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-white p-6 rounded-xl shadow-md border border-gray-200 border-l-4 border-l-blue-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h3 className="font-black text-gray-800 uppercase tracking-tight">{req.userName}</h3>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(req.date).toLocaleString()}</p>
                                    </div>
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-1 rounded font-black uppercase tracking-widest">PENDING</span>
                                </div>
                                
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-6">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Limit</p>
                                        <p className="font-bold text-gray-600">₹{req.currentLimit.toLocaleString()}</p>
                                    </div>
                                    <div className="text-gray-300">→</div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Requested</p>
                                        <p className="font-black text-blue-600 text-xl">₹{req.requestedLimit.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Retailer Justification</p>
                                    <p className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-gray-100 pl-3">"{req.reason}"</p>
                                </div>

                                <div className="flex gap-3">
                                    <Button fullWidth onClick={() => processRequest(req, true)}>Approve Limit</Button>
                                    <Button fullWidth variant="outline" className="text-red-600 border-red-100 hover:bg-red-50" onClick={() => processRequest(req, false)}>Reject Request</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-gray-800 uppercase tracking-tight">Post Ledger Entry</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
                        </div>
                        
                        <form onSubmit={handleRecord} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Target B2B Account</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-rani-500 bg-white"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose Account --</option>
                                    {users.filter(u => u.role === UserRole.RETAILER || u.role === UserRole.DISTRIBUTOR).map(u => (
                                        <option key={u.id} value={u.id}>{u.businessName || u.fullName} (Bal: ₹{u.outstandingDues})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Entry Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 outline-none focus:border-rani-500 bg-white"
                                        value={type}
                                        onChange={(e) => setType(e.target.value as TransactionType)}
                                    >
                                        <option value="PAYMENT">Payment In (Cr)</option>
                                        <option value="CREDIT_NOTE">Credit Note (Cr)</option>
                                        <option value="INVOICE">Sales Invoice (Dr)</option>
                                        <option value="DEBIT_NOTE">Debit Note (Dr)</option>
                                    </select>
                                </div>
                                <Input 
                                    label="Amount (₹)" 
                                    type="number" 
                                    required 
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>

                            <Input 
                                label="Narration / Remarks" 
                                placeholder="e.g. UPI Ref #9988..." 
                                required 
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            <Button fullWidth disabled={loading} className="h-12 shadow-xl shadow-rani-500/10">
                                {loading ? 'Posting to Ledger...' : 'Post Entry'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
