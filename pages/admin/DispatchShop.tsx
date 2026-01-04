
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';

export const DispatchShop: React.FC = () => {
    const { users, selectClient, clearCart } = useApp();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const clients = users.filter(u => 
        (u.role === UserRole.RETAILER || u.role === UserRole.DISTRIBUTOR) &&
        (u.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
         u.mobile?.includes(searchTerm))
    );

    const handleSelectClient = (client: typeof users[0]) => {
        // 1. Clear existing cart to prevent cross-contamination
        clearCart();
        // 2. Set the proxy context
        selectClient(client);
        // 3. Navigate to the shop
        navigate('/shop');
    };

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dispatch Order Portal</h1>
                    <p className="text-sm text-gray-500">Select a client to place an order on their behalf.</p>
                </div>
                <div className="relative w-full md:w-96">
                    <input 
                        type="text" 
                        placeholder="Search Client by Name, Business or Mobile..." 
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rani-500 transition-all bg-white shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clients.map(client => (
                    <div key={client.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:border-rani-300 hover:shadow-lg transition-all group flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${client.role === 'DISTRIBUTOR' ? 'bg-blue-600' : 'bg-rani-500'}`}>
                                {client.businessName?.charAt(0) || client.fullName.charAt(0)}
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${client.role === 'DISTRIBUTOR' ? 'bg-blue-50 text-blue-700' : 'bg-rani-50 text-rani-700'}`}>
                                {client.role}
                            </span>
                        </div>
                        
                        <div className="flex-1 mb-6">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{client.businessName}</h3>
                            <p className="text-sm text-gray-500 font-medium">{client.fullName}</p>
                            
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">📍</span>
                                    {client.city || 'Unknown City'}, {client.state || 'India'}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span className="text-gray-400">📱</span>
                                    {client.mobile}
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <span className="text-gray-400">💳</span>
                                    Limit: <span className={client.outstandingDues && client.outstandingDues > (client.creditLimit || 0) ? 'text-red-500' : 'text-green-600'}>
                                        ₹{(client.creditLimit || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button fullWidth onClick={() => handleSelectClient(client)} className="mt-auto group-hover:bg-rani-600">
                            Start Order ➝
                        </Button>
                    </div>
                ))}
            </div>

            {clients.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold uppercase tracking-widest">No clients found matching your search</p>
                </div>
            )}
        </div>
    );
};
