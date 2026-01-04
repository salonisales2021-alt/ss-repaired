
// ... (imports remain same)
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { db, parseAIJson } from '../../services/db';
import { Input } from '../../components/Input';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { NotificationCenter } from '../../components/NotificationCenter';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { BrandLogo } from '../../components/BrandLogo';
import { useToast } from '../../components/Toaster';
import { UserRole } from '../../types';

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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
                    <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
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
        // In a real app we'd query exact counts, here we estimate for the mock view logic
        
        return (
            <div className="animate-fade-in max-w-6xl mx-auto pb-12">
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

export const AdminSettings: React.FC = () => {
    const { toast } = useToast();
    const [gstKey, setGstKey] = useState(localStorage.getItem('SALONI_GST_API_KEY') || '');
    const [gstUrl, setGstUrl] = useState(localStorage.getItem('SALONI_GST_API_URL') || '');

    const handleSaveConfig = () => {
        localStorage.setItem('SALONI_GST_API_KEY', gstKey);
        localStorage.setItem('SALONI_GST_API_URL', gstUrl);
        toast("System configuration updated successfully.", "success");
    };

    return (
        <div className="animate-fade-in max-w-4xl pb-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-sm text-gray-500 mb-8">Configure platform-wide rules and secure parameters.</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 space-y-10">
                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Global Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input label="Default GST Rate (%)" type="number" defaultValue="5" />
                            <Input label="Platform Currency" defaultValue="INR (₹)" disabled />
                            <Input label="Min Bulk Order Quantity" type="number" defaultValue="12" />
                            <Input label="Support Email" defaultValue="salonisales2021@gmail.com" />
                        </div>
                    </section>

                    <section className="bg-gray-50/50 -mx-8 px-8 py-8 border-y border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">External Integrations</h3>
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    🏛️ Real-time GST Verification
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input 
                                        label="GST API Provider URL" 
                                        placeholder="https://api.provider.com/verify"
                                        value={gstUrl}
                                        onChange={(e) => setGstUrl(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <Input 
                                        label="API Key / Secret" 
                                        type="password"
                                        placeholder="Enter provider secret key"
                                        value={gstKey}
                                        onChange={(e) => setGstKey(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 italic">
                                        Leave empty to use <strong>Simulation Mode</strong> (Mock Data) for testing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline">Reset Defaults</Button>
                        <Button className="px-10" onClick={handleSaveConfig}>Save Configuration</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AdminLayout: React.FC = () => {
    const { logout, user } = useApp();
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.DISPATCH)) {
        return <Navigate to="/admin/login" replace />;
    }

    const allNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Shop Orders', path: '/admin/shop-orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Order Management', path: '/admin/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { name: 'Finance & Payments', path: '/admin/finance', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Product Catalog', path: '/admin/products', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { name: 'Client Scan (Bulk)', path: '/admin/bulk-client-onboarding', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
        { name: 'AI Bulk Upload', path: '/admin/bulk-onboarding', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
        { name: 'API Diagnostics', path: '/admin/diagnostics', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
        { name: 'Catalog Maker', path: '/admin/catalog-maker', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { name: 'Inventory & Stock', path: '/admin/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'User Management', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { name: 'Support Helpdesk', path: '/admin/helpdesk', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
        { name: 'Market Intelligence', path: '/admin/trends', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { name: 'Marketing Tools', path: '/admin/marketing', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { name: 'Reports', path: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Settings', path: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ];

    // RESTRICT NAV ITEMS FOR DISPATCH ROLE
    const allowedForDispatch = ['Dashboard', 'Shop Orders', 'Order Management', 'Inventory & Stock', 'Support Helpdesk'];
    
    const navItems = user.role === UserRole.DISPATCH 
        ? allNavItems.filter(item => allowedForDispatch.includes(item.name)) 
        : allNavItems.filter(item => item.name !== 'Shop Orders'); // Only show for Dispatch role

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
            <header className="bg-white text-luxury-black h-16 flex items-center justify-center px-4 md:px-6 shadow-sm border-b border-rani-100 z-30 sticky top-0">
                <div className="flex items-center gap-4 w-full justify-between">
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-luxury-black focus:outline-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <BrandLogo className="h-10" />
                        <div className="hidden sm:block border-l border-gray-200 pl-3">
                            <span className="text-gray-400 text-[10px] uppercase tracking-wider block">
                                {user.role === UserRole.DISPATCH ? 'Logistics Center' : 'Admin Portal'}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <div className="h-8 w-8 bg-rani-100 rounded-full flex items-center justify-center text-rani-700 font-bold border border-rani-200">
                            {user.fullName.charAt(0)}
                        </div>
                        <Button size="sm" variant="text" onClick={logout} className="text-gray-500 hover:text-red-500">Logout</Button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                <aside className={`
                    fixed lg:relative inset-y-0 left-0 z-20 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 transform 
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    pt-16 lg:pt-0 shadow-xl lg:shadow-none
                `}>
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">Management Interface</div>
                        <nav className="space-y-1">
                            {navItems.map(item => {
                                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                                return (
                                    <Link 
                                        key={item.path} 
                                        to={item.path} 
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 group ${
                                            isActive 
                                            ? 'bg-rani-50 text-white shadow-md shadow-rani-500/20' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-rani-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                        </svg>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </aside>
                {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-10 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
