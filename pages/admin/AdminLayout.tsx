
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { NotificationCenter } from '../../components/NotificationCenter';
import { BrandLogo } from '../../components/BrandLogo';
import { UserRole } from '../../types';
import { isLiveData } from '../../services/supabaseClient';

export const AdminLayout: React.FC = () => {
    const { logout, user } = useApp();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.DISPATCH)) {
        return <Navigate to="/admin/login" replace />;
    }

    const allNavItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h-2a2 2 0 01-2-2v-2z' },
        { name: 'Commercial Rules', path: '/admin/commercial-rules', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { name: 'Shop Orders', path: '/admin/shop-orders', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Order Management', path: '/admin/orders', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
        { name: 'Finance & Payments', path: '/admin/finance', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
        { name: 'Product Catalog', path: '/admin/products', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
        { name: 'Client Scan (Bulk)', path: '/admin/bulk-client-onboarding', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
        { name: 'AI Bulk Upload', path: '/admin/bulk-onboarding', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
        { name: 'API Diagnostics', path: '/admin/diagnostics', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
        { name: 'Inventory & Stock', path: '/admin/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
        { name: 'User Management', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { name: 'Support Helpdesk', path: '/admin/helpdesk', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' },
        { name: 'Market Intelligence', path: '/admin/trends', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
        { name: 'Reports', path: '/admin/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
        { name: 'Settings', path: '/admin/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ];

    // RESTRICT NAV ITEMS FOR DISPATCH ROLE
    const allowedForDispatch = ['Dashboard', 'Shop Orders', 'Order Management', 'Inventory & Stock', 'Support Helpdesk'];
    
    const navItems = user.role === UserRole.DISPATCH 
        ? allNavItems.filter(item => allowedForDispatch.includes(item.name)) 
        : allNavItems.filter(item => item.name !== 'Shop Orders'); 

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

            {!isLiveData && (
                <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 px-4 flex justify-between items-center">
                    <span>✨ Using Demo Data (Simulation Mode). Connect Real DB in Settings.</span>
                    <button 
                        onClick={() => navigate('/admin/settings')} 
                        className="bg-white text-blue-600 px-3 py-1 rounded-full uppercase tracking-wider text-[10px] hover:bg-blue-50"
                    >
                        Connect Live DB
                    </button>
                </div>
            )}

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

                        {/* EMPLOYEE CORNER */}
                        <div className="mt-8 px-2">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Employee Corner</div>
                            <Link 
                                to="/admin/sales-desk"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 mb-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-100`}
                            >
                                <span className="text-lg">🛒</span> Sales Desk / Order
                            </Link>
                        </div>
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
export default AdminLayout;
