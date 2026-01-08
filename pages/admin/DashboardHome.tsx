
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { db, parseAIJson } from '../../services/db';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Button } from '../../components/Button';
import { isLiveData } from '../../services/supabaseClient';

// Widget for AI Predictions
const RestockRecommender: React.FC = () => {
    const { products } = useApp();
    const { t } = useLanguage();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        analyzeShortages();
    }, [products]);

    const analyzeShortages = async () => {
        if (products.length === 0) return;
        
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const inventoryContext = products.map(p => ({
                id: p.id,
                name: p.name,
                totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
                avgWeeklySales: Math.floor(Math.random() * 20) + 5 
            }));

            const prompt = `Analyze this inventory. Predict which top 3 items will run out of stock in the next 30 days based on weekly sales. 
            Context: ${JSON.stringify(inventoryContext)}
            Return JSON only: { "items": [{ "productId": "...", "reason": "...", "recommendedQty": 123 }] }`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const res = parseAIJson(response.text, { items: [] } as any);
            if (res.items) {
                const hydrated = res.items.map((item: any) => ({
                    ...item,
                    product: products.find(p => p.id === item.productId)
                })).filter((i: any) => i.product);
                setRecommendations(hydrated);
            }
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">📊</span> {t('admin.restockTitle')}
                    </h3>
                    <p className="text-xs text-gray-400">{t('admin.restockSubtitle')}</p>
                </div>
                <button onClick={analyzeShortages} className="text-rani-600 hover:bg-rani-50 p-2 rounded-full transition-colors">
                    <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="space-y-4 py-4">
                    {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-lg"></div>)}
                </div>
            ) : recommendations.length > 0 ? (
                <div className="space-y-4">
                    {recommendations.map((rec, idx) => (rec.product && (
                        <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100 group transition-all hover:border-rani-200">
                            <img src={rec.product.images[0]} className="w-12 h-16 object-cover rounded shadow-sm" alt="" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{t('admin.shortageAlert')}</p>
                                <p className="font-bold text-sm text-gray-800 truncate">{rec.product.name}</p>
                                <p className="text-[10px] text-gray-500 italic mt-1 leading-tight line-clamp-1">"{rec.reason}"</p>
                            </div>
                            <div className="text-right flex flex-col justify-between">
                                <div className="text-xs font-bold text-gray-900">+{rec.recommendedQty}</div>
                                <button className="text-[10px] font-bold text-rani-600 underline opacity-0 group-hover:opacity-100 transition-opacity">{t('admin.restockAction')}</button>
                            </div>
                        </div>
                    )))}
                </div>
            ) : (
                <div className="py-12 text-center text-gray-400 italic text-sm flex flex-col items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {t('admin.analyzingTrends')}
                </div>
            )}
        </div>
    );
};

// New Component: System Status
const SystemHealthWidget: React.FC = () => {
    const hasAiKey = !!process.env.API_KEY;
    const isProd = process.env.NODE_ENV === 'production';

    return (
        <div className="bg-luxury-black text-white p-4 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl">
                    🚀
                </div>
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest">Live Operations Center</h3>
                    <p className="text-xs text-gray-400">System Performance Monitor</p>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${isLiveData ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${isLiveData ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs font-bold">{isLiveData ? 'DB Connected' : 'DB Offline'}</span>
                </div>
                
                <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${hasAiKey ? 'bg-purple-500/10 border-purple-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                    <div className={`w-2 h-2 rounded-full ${hasAiKey ? 'bg-purple-500' : 'bg-yellow-500'}`}></div>
                    <span className="text-xs font-bold">{hasAiKey ? 'AI Active' : 'AI Inactive'}</span>
                </div>

                <div className="px-4 py-2 rounded-lg border bg-blue-500/10 border-blue-500/30 flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400">{isProd ? 'PRODUCTION' : 'DEV MODE'}</span>
                </div>
            </div>
        </div>
    );
};

export const DashboardHome: React.FC = () => {
    const { products, user } = useApp();
    const [stats, setStats] = useState({
        orderCount: 0,
        userCount: 0,
        pendingApprovals: 0,
        recentOrders: [] as any[]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await db.getAdminDashboardData();
        setStats(data);
        setLoading(false);
    };

    // --- DISPATCH DEPARTMENT VIEW ---
    if (user?.role === UserRole.DISPATCH) {
        const readyToDispatchCount = stats.recentOrders.filter(o => o.status === 'READY').length;
        
        return (
            <div className="animate-fade-in max-w-6xl mx-auto pb-12">
                <SystemHealthWidget />
                
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Dispatch Logistics</h1>
                        <p className="text-sm text-gray-500">Manage shipments and inventory flow.</p>
                    </div>
                    <button onClick={loadStats} className="text-xs font-bold text-rani-600 hover:underline">Refresh Data</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-blue-500">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Orders</p>
                        <p className="text-3xl font-black text-gray-800">{stats.orderCount}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-rani-500">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Stock Items</p>
                        <p className="text-3xl font-black text-gray-800">{products.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-orange-500">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ready to Pack</p>
                        <p className="text-3xl font-black text-gray-800">{readyToDispatchCount > 0 ? readyToDispatchCount : 'All Clear'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-700">Recent Logistics Activity</h3>
                        <Link to="/admin/orders" className="text-xs text-rani-600 font-bold hover:underline">Manage All Shipments</Link>
                    </div>
                    <div className="space-y-4">
                        {stats.recentOrders.length > 0 ? stats.recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-4 last:border-0 last:pb-0 group transition-colors hover:bg-gray-50 px-2 rounded-lg">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                        #{order.id.toString().substring(0, 4)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800">{order.userBusinessName}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(order.createdAt).toLocaleDateString()} • {order.status}</p>
                                    </div>
                                </div>
                                {/* Financial data hidden for Dispatch */}
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${order.status === 'DISPATCHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {order.status}
                                </span>
                            </div>
                        )) : (
                            <div className="py-12 text-center text-gray-400 italic">No orders pending.</div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- FULL ADMIN VIEW ---
    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-12">
            <SystemHealthWidget />

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Admin Overview</h1>
                    <p className="text-sm text-gray-500">Monitor business health and supply chain signals.</p>
                </div>
                <button onClick={loadStats} className="text-xs font-bold text-rani-600 hover:underline">Refresh Stats</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Total Orders', value: stats.orderCount, color: 'border-blue-500', icon: '📦' },
                    { label: 'Live Products', value: products.length, color: 'border-rani-500', icon: '👗' },
                    { label: 'Total Users', value: stats.userCount, color: 'border-green-500', icon: '👥' },
                    { label: 'Pending Approvals', value: stats.pendingApprovals, color: 'border-orange-500', icon: '⌛' }
                ].map(stat => (
                    <div key={stat.label} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 ${stat.color} transition-all hover:-translate-y-1 hover:shadow-md cursor-default flex justify-between items-center`}>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-gray-800">{loading ? '...' : stat.value}</p>
                        </div>
                        <span className="text-3xl opacity-20">{stat.icon}</span>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-700">Recent Activity</h3>
                        <Link to="/admin/orders" className="text-xs text-rani-600 font-bold hover:underline">View All Orders</Link>
                    </div>
                    <div className="space-y-4">
                        {stats.recentOrders.length > 0 ? stats.recentOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-4 last:border-0 last:pb-0 group transition-colors hover:bg-gray-50 px-2 rounded-lg">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                        #{order.id.toString().substring(0, 4)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-800 group-hover:text-rani-600 transition-colors">{order.userBusinessName}</p>
                                        <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(order.createdAt).toLocaleDateString()} • {order.status}</p>
                                    </div>
                                </div>
                                <span className="font-bold text-luxury-black">₹{order.totalAmount.toLocaleString()}</span>
                            </div>
                        )) : (
                            <div className="py-12 text-center text-gray-400 italic">No orders recorded yet.</div>
                        )}
                    </div>
                </div>
                
                <RestockRecommender />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-6 uppercase text-xs tracking-widest">Global Operations</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link to="/admin/orders" className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center hover:bg-white hover:border-rani-200 transition-all group shadow-sm">
                            <span className="block text-2xl mb-2">📦</span>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-rani-600">Order Portal</span>
                        </Link>
                        <Link to="/admin/products" className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center hover:bg-white hover:border-rani-200 transition-all group shadow-sm">
                            <span className="block text-2xl mb-2">🏷️</span>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-rani-600">Product Management</span>
                        </Link>
                        <Link to="/admin/bulk-client-onboarding" className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center hover:bg-white hover:border-rani-200 transition-all group shadow-sm">
                            <span className="block text-2xl mb-2">🪪</span>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-rani-600">AI Client Scan</span>
                        </Link>
                        <Link to="/admin/bulk-onboarding" className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center hover:bg-white hover:border-rani-200 transition-all group shadow-sm">
                            <span className="block text-2xl mb-2">✨</span>
                            <span className="text-xs font-bold text-gray-600 group-hover:text-rani-600">AI Bulk Upload</span>
                        </Link>
                    </div>
                </div>
                
                <div className="bg-luxury-black text-white p-8 rounded-xl shadow-xl flex flex-col justify-center items-center text-center border border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-rani-500/10 rounded-full blur-[80px] -z-0 transition-all group-hover:bg-rani-500/20"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] -z-0"></div>
                    <div className="z-10">
                        <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-rani-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mb-3 tracking-tight">Portal Maintenance Notice</h3>
                        <p className="text-sm text-gray-400 mb-8 max-w-xs leading-relaxed">System upgrade scheduled for 15th Oct. AI features will be enhanced with multi-modal reasoning capabilities.</p>
                        <Button variant="outline" className="text-white border-white/20 hover:bg-white hover:text-black transition-all font-bold px-10">View Change Log</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DashboardHome;
    