
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Transaction, Order } from '../../types';
import { Button } from '../../components/Button';
import { Navigate, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export const Ledger: React.FC = () => {
    const { user } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (user) {
                setLoading(true);
                const [txData, orderData] = await Promise.all([
                    db.getTransactions(user.id),
                    db.getOrdersByUser(user.id)
                ]);
                setTransactions(txData);
                setMyOrders(orderData);
                setLoading(false);
            }
        };
        load();
    }, [user]);

    if (!user) return <Navigate to="/login" />;

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 font-heading">Financial Statement</h1>
                        <p className="text-sm text-gray-500">B2B Order History & Settlement Records</p>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>🖨️ Print Ledger</Button>
                </div>

                {user.gaddiId && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-2xl mb-8 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-green-700 uppercase tracking-widest mb-1">Active Partnership Protocol</p>
                            <h3 className="text-lg font-bold text-gray-800">Billed Through Gaddi: J M Jain LLP</h3>
                            <p className="text-sm text-gray-600">Your direct financial liability is zero. Payments are handled by your Gaddi partner.</p>
                        </div>
                        <span className="text-4xl">🛡️</span>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                            <tr>
                                <th className="p-5">Date</th>
                                <th className="p-5">Ref / Details</th>
                                <th className="p-5">Settlement Status</th>
                                <th className="p-5 text-right">Memo Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {myOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="p-5 text-gray-500 font-mono">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <p className="font-bold text-gray-800">Purchase Order #{order.id.slice(0,8)}</p>
                                        <p className="text-[10px] text-gray-400 uppercase">{order.items.length} Items Packed</p>
                                        <button onClick={() => window.open(`#/admin/invoice/${order.id}`, '_blank')} className="text-rani-600 text-[10px] font-black underline mt-2 hover:text-rani-700">View Memo Copy</button>
                                    </td>
                                    <td className="p-5">
                                        {order.gaddiId ? (
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black border border-blue-100">GADDI SETTLED</span>
                                        ) : (
                                            <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-[10px] font-black border border-gray-100 uppercase">{order.status}</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-right font-black text-lg text-gray-800">
                                        ₹{order.totalAmount.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {myOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">No order history found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
