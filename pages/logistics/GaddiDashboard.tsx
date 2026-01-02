
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Order } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';

export const GaddiDashboard: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const [associatedOrders, setAssociatedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [approving, setApproving] = useState<string | null>(null);

    useEffect(() => {
        loadAssociatedOrders();
    }, []);

    const loadAssociatedOrders = async () => {
        setLoading(true);
        const all = await db.getAllOrders();
        // Gaddi Firm sees orders billed to them
        setAssociatedOrders(all.filter(o => o.gaddiId === user?.id));
        setLoading(false);
    };

    const handleApproveTrade = async (order: Order) => {
        if (!confirm("Approve this trade? By confirming, your firm takes responsibility for the payment of this memo value.")) return;
        
        setApproving(order.id);
        try {
            await db.updateOrder(order.id, {
                status: 'ACCEPTED'
            });
            alert("Trade Settlement Approved. Order status updated to PAID/ACCEPTED.");
            loadAssociatedOrders();
        } catch (err) {
            alert("Failed to update trade record.");
        } finally {
            setApproving(null);
        }
    };

    if (!user || user.role !== 'GADDI') {
        return <div className="p-8 text-center">Unauthorized. Gaddi Firms only.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-luxury-black text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <BrandLogo className="h-10" />
                    <div>
                        <h1 className="font-bold text-sm leading-tight text-white">Gaddi Firm Desk</h1>
                        <p className="text-[10px] text-rani-400 uppercase tracking-widest font-black">{user.businessName}</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/login')}>Logout</Button>
            </header>

            <main className="p-4 container mx-auto max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Trade Approvals</h2>
                    <button onClick={loadAssociatedOrders} className="text-rani-600 font-black text-xs uppercase tracking-widest border border-rani-100 px-3 py-1.5 rounded-lg bg-white shadow-sm">Refresh</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Credit Utilized</p>
                        <p className="text-xl font-black text-red-600">₹{user.outstandingDues?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Available Limit</p>
                        <p className="text-xl font-black text-green-600">₹{(user.creditLimit! - user.outstandingDues!).toLocaleString()}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Syncing firm records...</div>
                ) : associatedOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">🤝</div>
                        <h3 className="font-bold text-gray-800 text-lg">No Active Memos</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-[200px]">Retailer orders billed to your Gaddi firm will appear here for verification.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {associatedOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 relative overflow-hidden group hover:border-rani-200 transition-all">
                                {approving === order.id && (
                                    <div className="absolute inset-0 bg-white/95 z-20 flex flex-col items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-rani-500 border-t-transparent mb-2"></div>
                                        <p className="text-xs font-black text-rani-600 uppercase">Updating Ledger...</p>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Memo ID</span>
                                        <p className="font-mono font-bold text-gray-800">#MEMO-{order.id.slice(0,8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {order.status === 'PENDING' ? 'WAITING APPROVAL' : 'TRADE SETTLED'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Retailer (Consignee)</span>
                                    <p className="font-bold text-gray-900 text-lg">{order.userBusinessName}</p>
                                    <div className="flex gap-4 mt-2">
                                        <div className="text-[10px] font-bold text-gray-500">Lots: <span className="text-gray-900">{order.items.length} Units</span></div>
                                        <div className="text-[10px] font-bold text-gray-500">Firm Net: <span className="text-rani-600 font-black">₹{order.gaddiAmount?.toLocaleString() || order.totalAmount.toLocaleString()}</span></div>
                                    </div>
                                </div>

                                {order.status === 'PENDING' ? (
                                    <div className="flex gap-2">
                                        <Button fullWidth onClick={() => handleApproveTrade(order)} className="h-14 text-sm font-black uppercase tracking-widest shadow-lg">
                                            ✅ Approve Settlement
                                        </Button>
                                        <Button variant="outline" className="px-4" onClick={() => window.open(`#/admin/invoice/${order.id}?mode=gaddi`, '_blank')}>👁️</Button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-black text-green-700 uppercase">Verification</p>
                                            <p className="text-sm font-bold text-green-800">Settled to Factory Ledger</p>
                                        </div>
                                        <button onClick={() => window.open(`#/admin/invoice/${order.id}?mode=gaddi`, '_blank')} className="text-xs text-rani-600 font-black underline hover:text-rani-700">View Tax Invoice</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex justify-around items-center md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button className="text-rani-600 flex flex-col items-center gap-1">
                    <span className="text-2xl">🤝</span>
                    <span className="text-[9px] font-black uppercase">Firms</span>
                </button>
                <button className="text-gray-400 flex flex-col items-center gap-1" onClick={() => navigate('/ledger')}>
                    <span className="text-2xl">📑</span>
                    <span className="text-[9px] font-black uppercase">Ledger</span>
                </button>
                <button className="text-gray-400 flex flex-col items-center gap-1" onClick={() => alert('Support line: +919911076258')}>
                    <span className="text-2xl">📞</span>
                    <span className="text-[9px] font-black uppercase">Help</span>
                </button>
            </div>
        </div>
    );
};
