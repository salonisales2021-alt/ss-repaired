
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '../../services/db';
import { Order, User, Product } from '../../types';

type ReportTab = 'SALES' | 'INVENTORY' | 'CUSTOMERS';

export const Reports: React.FC = () => {
    const { products } = useApp();
    const [activeTab, setActiveTab] = useState<ReportTab>('SALES');
    const [dateRange, setDateRange] = useState('30');
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [o, u] = await Promise.all([
                db.getAllOrders(),
                db.getUsers()
            ]);
            setOrders(o);
            setCustomers(u);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- SALES ANALYTICS ---
    const calculateSalesData = () => {
        const salesByDate: Record<string, number> = {};
        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            salesByDate[date] = (salesByDate[date] || 0) + order.totalAmount;
        });
        return Object.entries(salesByDate).map(([date, amount]) => ({ date, amount }));
    };
    
    const salesData = calculateSalesData();
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // --- INVENTORY ANALYTICS ---
    const inventoryData = products.map(p => ({
        name: p.name.substring(0, 15) + '...',
        stock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        value: p.variants.reduce((sum, v) => sum + (v.stock * (v.pricePerPiece * v.piecesPerSet)), 0)
    })).sort((a, b) => b.value - a.value);

    const totalStockValue = inventoryData.reduce((sum, i) => sum + i.value, 0);
    const lowStockItems = products.filter(p => p.variants.some(v => v.stock < 10));

    // --- CUSTOMER ANALYTICS ---
    const customerData = customers
        .filter(u => u.role === 'RETAILER' || u.role === 'DISTRIBUTOR')
        .map(u => {
            const userOrders = orders.filter(o => o.userId === u.id);
            const totalSpend = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            return {
                name: u.businessName || u.fullName,
                orders: userOrders.length,
                spend: totalSpend
            };
        })
        .sort((a, b) => b.spend - a.spend);

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Business Reports</h1>
                    <p className="text-sm text-gray-500">Deep dive into your sales, inventory, and customer data.</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        className="bg-white border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-rani-500"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last Quarter</option>
                        <option value="365">This Year</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        🖨️ Print Report
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-lg overflow-hidden shadow-sm">
                {(['SALES', 'INVENTORY', 'CUSTOMERS'] as ReportTab[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${
                            activeTab === tab 
                            ? 'bg-rani-50 text-rani-600 border-b-2 border-rani-500' 
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        {tab} OVERVIEW
                    </button>
                ))}
            </div>

            <div className="bg-white p-6 rounded-b-lg shadow-sm border border-gray-200 border-t-0 -mt-8 pt-8">
                {loading ? (
                    <div className="py-20 text-center text-gray-400 animate-pulse">Aggregating real-time data...</div>
                ) : (
                    <>
                    {/* --- SALES REPORT --- */}
                    {activeTab === 'SALES' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-green-50 p-6 rounded border border-green-100">
                                    <div className="text-green-600 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue</div>
                                    <div className="text-3xl font-bold text-gray-800">₹{totalRevenue.toLocaleString()}</div>
                                </div>
                                <div className="bg-blue-50 p-6 rounded border border-blue-100">
                                    <div className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">Total Orders</div>
                                    <div className="text-3xl font-bold text-gray-800">{orders.length}</div>
                                </div>
                                <div className="bg-purple-50 p-6 rounded border border-purple-100">
                                    <div className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-2">Avg Order Value</div>
                                    <div className="text-3xl font-bold text-gray-800">₹{Math.round(averageOrderValue).toLocaleString()}</div>
                                </div>
                            </div>

                            <div className="h-80 w-full bg-white border border-gray-100 p-4 rounded">
                                <h3 className="text-lg font-bold text-gray-800 mb-4">Revenue Trend</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{fontSize: 12}} />
                                        <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `₹${val/1000}k`} />
                                        <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} />
                                        <Area type="monotone" dataKey="amount" stroke="#10B981" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* --- INVENTORY REPORT --- */}
                    {activeTab === 'INVENTORY' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Valuation by Product</h3>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={inventoryData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 10}} />
                                                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Value']} />
                                                <Bar dataKey="value" fill="#E01A8D" radius={[0, 4, 4, 0]} barSize={20} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded border border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Health</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                                            <span className="text-gray-600 font-medium">Total Stock Value</span>
                                            <span className="text-xl font-bold text-gray-900">₹{totalStockValue.toLocaleString()}</span>
                                        </div>
                                        <div className="p-4 bg-red-50 border border-red-100 rounded">
                                            <div className="text-red-700 font-bold mb-2 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                Low Stock Alerts ({lowStockItems.length})
                                            </div>
                                            <ul className="text-sm text-red-600 space-y-1 list-disc pl-5">
                                                {lowStockItems.length > 0 ? lowStockItems.map(p => (
                                                    <li key={p.id}>{p.name} (SKU: {p.sku})</li>
                                                )) : <li>All stock levels healthy.</li>}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CUSTOMERS REPORT --- */}
                    {activeTab === 'CUSTOMERS' && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs">
                                        <tr>
                                            <th className="p-4">Customer Name</th>
                                            <th className="p-4">Total Orders</th>
                                            <th className="p-4">Total Spend</th>
                                            <th className="p-4">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {customerData.map((c, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                                                    {i < 3 && <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>}
                                                    {c.name}
                                                </td>
                                                <td className="p-4">{c.orders}</td>
                                                <td className="p-4 font-bold text-rani-600">₹{c.spend.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Active</span>
                                                </td>
                                            </tr>
                                        ))}
                                        {customerData.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No customer data available.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>
    );
};
