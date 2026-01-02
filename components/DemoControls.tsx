
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

export const DemoControls: React.FC = () => {
    const { login, logout, user } = useApp();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Safe check for Development mode
    const meta = import.meta as any;
    const isDev = meta && meta.env && meta.env.DEV;

    if (!isDev) return null;

    const handleQuickLogin = async (role: string, email: string) => {
        await logout();
        
        let targetRole: 'ADMIN' | 'CUSTOMER' = 'CUSTOMER';
        if (role === 'ADMIN' || role === 'DISPATCH' || role === 'SUPER_ADMIN') targetRole = 'ADMIN';

        const result = await login(email, targetRole, 'password123'); // Uses the mock password from db.ts
        if (result.success) {
            if (targetRole === 'ADMIN') navigate('/admin/dashboard');
            else if (role === 'AGENT') navigate('/agent/dashboard');
            else if (role === 'GADDI') navigate('/logistics/dashboard');
            else if (role === 'DISTRIBUTOR') navigate('/distributor/dashboard');
            else navigate('/');
            setIsOpen(false);
        } else {
            alert("Demo Login Failed: " + result.error);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 left-6 z-[100] bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold shadow-lg border border-gray-700 opacity-50 hover:opacity-100 transition-opacity"
            >
                DEV_DEMO_MODE
            </button>
        );
    }

    return (
        <div className="fixed bottom-24 left-6 z-[100] bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700 w-64 animate-fade-in-up">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-xs uppercase tracking-widest text-rani-400">Quick Role Switch</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-2">
                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1">Administrative</p>
                <button 
                    onClick={() => handleQuickLogin('SUPER_ADMIN', 'admin@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>👨‍💼 Super Admin</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Full Access</span>
                </button>
                <button 
                    onClick={() => handleQuickLogin('DISPATCH', 'dispatch@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>🚚 Dispatch Dept</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Restricted</span>
                </button>

                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 mt-3">B2B Partners</p>
                <button 
                    onClick={() => handleQuickLogin('RETAILER', 'retailer@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>🛍️ Retailer</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Shop Front</span>
                </button>
                <button 
                    onClick={() => handleQuickLogin('DISTRIBUTOR', 'distributor@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>🏢 Distributor</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Credit Node</span>
                </button>
                <button 
                    onClick={() => handleQuickLogin('AGENT', 'agent@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>💼 Sales Agent</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Field App</span>
                </button>
                <button 
                    onClick={() => handleQuickLogin('GADDI', 'gaddi@saloni.com')}
                    className="w-full text-left px-3 py-2 rounded bg-gray-800 hover:bg-gray-700 text-xs flex justify-between items-center group"
                >
                    <span>🏛️ Gaddi Firm</span>
                    <span className="text-[9px] bg-gray-900 px-1 rounded text-gray-500 group-hover:text-white">Logistics</span>
                </button>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 text-[9px] text-gray-500 text-center">
                Current: {user ? `${user.role} (${user.fullName})` : 'Guest'}
            </div>
        </div>
    );
};
