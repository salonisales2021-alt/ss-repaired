
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Order, User } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';

export const DistributorDashboard: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [pendingGuarantees, setPendingGuarantees] = useState<Order[]>([]);
    const [myRetailers, setMyRetailers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'PENDING' | 'SETTLEMENTS' | 'RETAILERS'>('PENDING');

    useEffect(() => {
        loadDistributorData();
    }, [user]);

    const loadDistributorData = async () => {
        if (!user) return;
        setLoading(true);
        const [allOrders, allUsers] = await Promise.all([
            db.getAllOrders(),
            db.getUsers()
        ]);
        
        setPendingGuarantees(allOrders.filter(o => o.guarantorId === user.id));
        setMyRetailers(allUsers.filter(u => u.assignedDistributorId === user.id));
        
        setLoading(false);
    };

    const handleGuaranteeOrder = async (order: Order) => {
        if (!confirm("Approve this order for credit? You will be responsible for the factory payment within 60-90 days.")) return;
        
        try {
            await db.updateOrder(order.id, {
                status: 'GUARANTEED'
            });
            alert("Order Approved. Factory will start processing.");
            loadDistributorData();
        } catch (err) {
            alert("Operation failed.");
        }
    };

    if (!user || user.role !== 'DISTRIBUTOR') {
        return <div className="p-8 text-center">Unauthorized. Distributor access only.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-luxury-black text-white p-6 sticky top-0 z-20 shadow-2xl border-b border-gray-800">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <BrandLogo className="h-12" />
                        <div>
                            <h1 className="font-black text-lg tracking-tight leading-none uppercase italic text-white">Distributor Console</h1>
                            <p className="text-[10px] text-rani-400 uppercase tracking-[0.2em] font-black mt-1">{user.businessName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Available Credit</p>
                            <p className="text-lg font-black text-green-400">₹{user.creditLimit?.toLocaleString()}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/login')}>Logout</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-8 max-w-6xl">
                <div className="flex gap-4 mb-10 overflow-x-auto no-scrollbar bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    {[
                        { id: 'PENDING', label: 'Credit Approvals', icon: '📝' },
                        { id: 'SETTLEMENTS', label: 'Ledger Settlements', icon: '📑' },
                        { id: 'RETAILERS', label: 'Retailer Network', icon: '👥' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-luxury-black text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                            <span>{tab.icon}</span> {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Syncing Network Records...</div>
                ) : (
                    <div className="animate-fade-in">
                        {activeTab === 'PENDING' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {pendingGuarantees.length === 0 ? (
                                    <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-black uppercase tracking-widest">No pending credit requests</p>
                                    </div>
                                ) : (
                                    pendingGuarantees.map(order => (
                                        <div key={order.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 flex flex-col hover:border-rani-200 transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retailer</span>
                                                    <p className="font-bold text-gray-900 text-lg">{order.userBusinessName}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="space-y-3 mb-8 bg-gray-50 p-4 rounded-2xl">
                                                <div className="flex justify-between text-[11px] font-bold">
                                                    <span className="text-gray-500">Retailer Total:</span>
                                                    <span className="text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold border-t border-gray-200 pt-3">
                                                    <span className="text-gray-500">To Factory:</span>
                                                    <span className="text-blue-600">₹{order.factoryAmount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {order.status === 'PENDING' ? (
                                                <Button fullWidth onClick={() => handleGuaranteeOrder(order)} className="h-14 font-black uppercase tracking-widest shadow-lg">
                                                    ✅ Approve Order
                                                </Button>
                                            ) : (
                                                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100 text-[10px] font-black text-green-700 uppercase tracking-widest">
                                                    Approved
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'RETAILERS' && (
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-200">
                                        <tr>
                                            <th className="p-6">Business Name</th>
                                            <th className="p-6">Credit Limit</th>
                                            <th className="p-6">Current Dues</th>
                                            <th className="p-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {myRetailers.map(retailer => (
                                            <tr key={retailer.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="p-6">
                                                    <p className="font-bold text-gray-900">{retailer.businessName}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{retailer.fullName} • {retailer.mobile}</p>
                                                </td>
                                                <td className="p-6 font-bold">₹{retailer.creditLimit?.toLocaleString()}</td>
                                                <td className="p-6 font-black text-red-600">₹{retailer.outstandingDues?.toLocaleString()}</td>
                                                <td className="p-6 text-right">
                                                    <button onClick={() => navigate(`/ledger?uid=${retailer.id}`)} className="text-rani-600 font-black text-[10px] uppercase hover:underline">View Ledger</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
