import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';

export const DemoControls: React.FC = () => {
    const { login, user } = useApp();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Only show in development or if explicitly enabled
    const env = (import.meta as any).env || {};
    const isDev = env.DEV || window.location.hostname === 'localhost';
    if (!isDev) return null;

    const handleSwitch = async (email: string, role: string) => {
        await login(email, role === 'ADMIN' || role === 'DISPATCH' ? 'ADMIN' : 'CUSTOMER', 'password123');
        setIsOpen(false);
        if (role === 'ADMIN' || role === 'DISPATCH') navigate('/admin/dashboard');
        else if (role === 'GADDI') navigate('/logistics/dashboard');
        else if (role === 'AGENT') navigate('/agent/dashboard');
        else if (role === 'DISTRIBUTOR') navigate('/distributor/dashboard');
        else navigate('/shop');
    };

    return (
        <div className="fixed bottom-6 left-6 z-[9999]">
            {isOpen ? (
                <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-64 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                        <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">Developer Demo Mode</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-black">✕</button>
                    </div>
                    <div className="space-y-2">
                        <DemoButton 
                            icon="👑" label="Super Admin" 
                            onClick={() => handleSwitch('sarthak_huria@yahoo.com', UserRole.SUPER_ADMIN)} 
                            active={user?.role === UserRole.SUPER_ADMIN}
                        />
                        <DemoButton 
                            icon="🚚" label="Dispatch Dept" 
                            onClick={() => handleSwitch('employee@salonisales.com', UserRole.DISPATCH)} 
                            active={user?.role === UserRole.DISPATCH}
                        />
                        <div className="h-px bg-gray-100 my-2"></div>
                        <DemoButton 
                            icon="🛍️" label="Retailer (Priya)" 
                            onClick={() => handleSwitch('retailer@salonisale.com', UserRole.RETAILER)} 
                            active={user?.email === 'retailer@salonisale.com'}
                        />
                        <DemoButton 
                            icon="🏛️" label="Gaddi Firm (J M Jain)" 
                            onClick={() => handleSwitch('accounts@jmjain.com', UserRole.GADDI)} 
                            active={user?.role === UserRole.GADDI}
                        />
                        <DemoButton 
                            icon="💼" label="Sales Agent" 
                            onClick={() => handleSwitch('agent@salonisale.com', UserRole.AGENT)} 
                            active={user?.role === UserRole.AGENT}
                        />
                    </div>
                </div>
            ) : (
                <button 
                    onClick={() => setIsOpen(true)}
                    className="bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all border-2 border-white/20 hover:scale-105"
                >
                    ⚡ Dev Demo
                </button>
            )}
        </div>
    );
};

const DemoButton = ({ icon, label, onClick, active }: any) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${active ? 'bg-rani-50 text-rani-700 ring-1 ring-rani-200' : 'hover:bg-gray-50 text-gray-700'}`}
    >
        <span>{icon}</span>
        <span>{label}</span>
        {active && <span className="ml-auto text-[8px] bg-rani-500 text-white px-1.5 py-0.5 rounded">NOW</span>}
    </button>
);