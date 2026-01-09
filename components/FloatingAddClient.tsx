
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, User } from '../types';
import { Button } from './Button';
import { Input } from './Input';
import { useToast } from './Toaster';

export const FloatingAddClient: React.FC = () => {
    const { user, registerUser } = useApp();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        fullName: '',
        mobile: '',
        email: ''
    });

    // Only show for Employees (Admin, Dispatch, Agent)
    const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCH, UserRole.AGENT];
    if (!user || !allowedRoles.includes(user.role)) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const newUser: User = {
            id: `u-${Date.now()}`,
            email: formData.email || `client-${Date.now()}@temp.com`,
            fullName: formData.fullName,
            businessName: formData.businessName,
            mobile: formData.mobile,
            role: UserRole.RETAILER,
            isApproved: true,
            isPreBookApproved: false,
            creditLimit: 0,
            outstandingDues: 0,
            // If Agent created, auto-assign
            assignedAgentId: user.role === UserRole.AGENT ? user.id : undefined
        };

        const password = formData.mobile || 'Saloni123';
        
        const result = await registerUser(newUser, password);
        if (result.success) {
            toast(`Client Added! Password: ${password}`, "success");
            setIsOpen(false);
            setFormData({ businessName: '', fullName: '', mobile: '', email: '' });
        } else {
            toast(result.error || "Failed to add client", "error");
        }
        setIsSaving(false);
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-24 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
                title="Quick Add Client"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {/* Tooltip Bubble */}
                <div className="absolute right-full mr-3 bg-white text-gray-800 px-3 py-1 rounded-lg shadow-md text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-100">
                    New Client
                </div>
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                            <h3 className="font-bold text-lg">Quick Client Registration</h3>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full">✕</button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <Input 
                                label="Business Name" 
                                required 
                                value={formData.businessName}
                                onChange={e => setFormData({...formData, businessName: e.target.value})}
                            />
                            <Input 
                                label="Owner Name" 
                                required 
                                value={formData.fullName}
                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                            />
                            <Input 
                                label="Mobile Number" 
                                required 
                                value={formData.mobile}
                                onChange={e => setFormData({...formData, mobile: e.target.value})}
                            />
                            <Input 
                                label="Email (Optional)" 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                            
                            <div className="pt-2">
                                <Button fullWidth disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 h-12 shadow-lg">
                                    {isSaving ? 'Creating...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
