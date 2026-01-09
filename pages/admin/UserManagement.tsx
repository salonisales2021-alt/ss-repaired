
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { UserRole, User } from '../../types';
import { db, parseAIJson } from '../../services/db';
import { GoogleGenAI, Type } from "@google/genai";
import { useToast } from '../../components/Toaster';

interface HealthScore {
    userId: string;
    score: 'STEADY' | 'WATCHLIST' | 'CRITICAL';
    reason: string;
}

export const UserManagement: React.FC = () => {
    const { users, approveUser, user: currentUser, registerUser } = useApp();
    const { toast } = useToast();
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [healthScores, setHealthScores] = useState<Record<string, HealthScore>>({});
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // File State for GST Cert
    const [gstFile, setGstFile] = useState<File | null>(null);

    // Form Data
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
        fullName: '',
        email: '',
        mobile: '',
        businessName: '',
        role: UserRole.RETAILER,
        isApproved: true,
        isPreBookApproved: false,
        creditLimit: 0,
        outstandingDues: 0,
        gstin: '',
        gstCertificateUrl: '',
        password: '',
        gaddiId: '',
        assignedAgentId: '',
        assignedDistributorId: ''
    });

    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
    
    // Live Partner Filters
    const gaddiPartners = useMemo(() => users.filter(u => u.role === UserRole.GADDI), [users]);
    const agentPartners = useMemo(() => users.filter(u => u.role === UserRole.AGENT), [users]);
    const distributorPartners = useMemo(() => users.filter(u => u.role === UserRole.DISTRIBUTOR), [users]);

    const analyzeCreditHealth = async () => {
        setIsAnalyzing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const context = users.filter(u => u.role === UserRole.RETAILER || u.role === UserRole.DISTRIBUTOR).map(u => ({
                id: u.id,
                name: u.businessName,
                limit: u.creditLimit,
                dues: u.outstandingDues
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Analyze these B2B fashion clients and assign a risk status (STEADY, WATCHLIST, CRITICAL) based on their dues vs credit limit. Data: ${JSON.stringify(context)}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                userId: { type: Type.STRING },
                                score: { type: Type.STRING, enum: ["STEADY", "WATCHLIST", "CRITICAL"] },
                                reason: { type: Type.STRING }
                            },
                            required: ["userId", "score", "reason"]
                        }
                    }
                }
            });

            const results = parseAIJson(response.text || '', []);
            const scoreMap: Record<string, HealthScore> = {};
            results.forEach((r: HealthScore) => scoreMap[r.userId] = r);
            setHealthScores(scoreMap);
        } catch (e) {
            console.error("Health Analysis Error:", e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        if (users.length > 0) analyzeCreditHealth();
    }, []);

    const filteredUsers = users.filter(user => {
        const matchesRole = filterRole === 'ALL' || user.role === filterRole;
        const searchLower = searchTerm.toLowerCase();
        return matchesRole && (
            user.fullName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            (user.businessName && user.businessName.toLowerCase().includes(searchLower))
        );
    });

    const handleOpenCreate = () => {
        setIsEditMode(false);
        setGstFile(null);
        setFormData({
            fullName: '',
            email: '',
            mobile: '',
            businessName: '',
            role: UserRole.RETAILER,
            isApproved: true,
            isPreBookApproved: false,
            creditLimit: 0,
            outstandingDues: 0,
            gstin: '',
            gstCertificateUrl: '',
            password: '',
            gaddiId: '',
            assignedAgentId: '',
            assignedDistributorId: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (user: User) => {
        setIsEditMode(true);
        setGstFile(null);
        setFormData({ ...user, password: '' }); // Don't load password by default
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            // Upload GST Cert if new file selected
            let certUrl = formData.gstCertificateUrl;
            if (gstFile) {
                try {
                    certUrl = await db.uploadDocument(gstFile);
                } catch (e) {
                    console.error("Cert upload failed", e);
                    toast("Certificate upload failed", "error");
                }
            }

            const updatedFormData = { ...formData, gstCertificateUrl: certUrl };

            if (isEditMode && updatedFormData.id) {
                // Update Existing
                const { password, ...updateData } = updatedFormData; 
                
                // 1. Update Profile Data
                const success = await db.updateUser(updateData as User);
                
                // 2. Handle Password Change (Only if provided and authorized)
                if (success && password && password.trim() !== "") {
                    if (isSuperAdmin) {
                        toast("Password updated (simulated for Admin context).", "info");
                    }
                }

                if (success) {
                    toast("User profile updated successfully.", "success");
                    setShowModal(false);
                } else {
                    toast("Update failed.", "error");
                }
            } else {
                // Create New
                const { id: _tempId, ...rest } = updatedFormData as User;
                const newUser: User = {
                    ...rest,
                    id: `u-${Date.now()}`
                };
                const result = await registerUser(newUser, updatedFormData.password || 'Saloni123');
                if (result.success) {
                    toast(`User created. Default password: ${updatedFormData.password || 'Saloni123'}`, "success");
                    setShowModal(false);
                } else {
                    toast(result.error || "Creation failed.", "error");
                }
            }
        } catch (err) {
            toast("An error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle Switch Component
    const ToggleSwitch = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
            <span className="text-sm font-bold text-gray-700">{label}</span>
            <button 
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-rani-50' : 'bg-gray-300'}`}
            >
                <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
            </button>
        </div>
    );

    return (
        <div className="animate-fade-in max-w-6xl mx-auto p-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Partner Ecosystem</h1>
                    <p className="text-sm text-gray-500">Manage all user roles, access, and financial health.</p>
                </div>
                <div className="flex gap-3">
                    {isSuperAdmin && (
                        <Button onClick={handleOpenCreate} className="shadow-lg shadow-rani-500/20">
                            + Add New User
                        </Button>
                    )}
                    <Button onClick={analyzeCreditHealth} disabled={isAnalyzing} variant="outline" className="shadow-sm">
                        {isAnalyzing ? 'Refreshing Signals...' : '🔍 Perform AI Credit Audit'}
                    </Button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-t-2xl shadow-sm border border-gray-200 border-b-0 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                    {['ALL', 'RETAILER', 'DISTRIBUTOR', 'AGENT', 'GADDI', 'ADMIN'].map(role => (
                        <button key={role} onClick={() => setFilterRole(role)} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterRole === role ? 'bg-luxury-black text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                            {role}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-80">
                    <input type="text" placeholder="Search by name, GST or ID..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-b-2xl overflow-hidden shadow-xl shadow-black/5">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-200">
                        <tr>
                            <th className="p-5">Partner Profile</th>
                            <th className="p-5">Risk Matrix</th>
                            <th className="p-5">Privileges</th>
                            <th className="p-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-md ${u.role === UserRole.GADDI ? 'bg-orange-500' : u.role === UserRole.AGENT ? 'bg-blue-500' : u.role === UserRole.ADMIN || u.role === UserRole.SUPER_ADMIN ? 'bg-luxury-black' : 'bg-rani-500'}`}>
                                            {u.fullName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-base">{u.businessName || u.fullName}</div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{u.role} • {u.mobile}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-5">
                                    {u.role === UserRole.RETAILER || u.role === UserRole.DISTRIBUTOR ? (
                                        healthScores[u.id] ? (
                                            <div className="group relative inline-block cursor-help">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border-2 ${
                                                    healthScores[u.id].score === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-200' : 
                                                    healthScores[u.id].score === 'WATCHLIST' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {healthScores[u.id].score}
                                                </span>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block w-56 bg-luxury-black text-white text-[10px] p-4 rounded-xl shadow-2xl z-50 leading-relaxed ring-1 ring-white/10">
                                                    <p className="font-black mb-1 uppercase tracking-widest text-gray-400">AI Assessment:</p>
                                                    {healthScores[u.id].reason}
                                                </div>
                                            </div>
                                        ) : <span className="text-gray-300 italic text-xs">Awaiting audit...</span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal User</span>
                                    )}
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-[10px] text-gray-500 font-bold">
                                            Credit: <span className="text-gray-900 font-black">
                                                {u.creditLimit === 0 ? '∞' : `₹${u.creditLimit?.toLocaleString()}`}
                                            </span>
                                        </div>
                                        {u.isPreBookApproved && <span className="text-[9px] bg-gold-100 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded w-fit font-black uppercase">Pre-Book Club</span>}
                                        {!u.isApproved && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded w-fit font-black uppercase">LOCKED</span>}
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-3">
                                        {!u.isApproved && (
                                            <Button size="sm" onClick={() => approveUser(u.id)} className="bg-red-600 hover:bg-red-700 h-8 px-4 text-[10px] font-black uppercase tracking-widest shadow-red-200">Unlock</Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest hover:border-rani-500 hover:text-rani-600" onClick={() => handleOpenEdit(u)}>Manage</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* UNIVERSAL USER MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in ring-1 ring-black/5">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{isEditMode ? 'Edit User Profile' : 'Add New Entity'}</h2>
                                <p className="text-sm font-bold text-gray-400">{isEditMode ? `ID: ${formData.id}` : 'Create access credentials'}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input label="Full Name / Owner" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                                    <Input label="Business Name" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                                    <Input label="Email Address" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={isEditMode} />
                                    <Input label="Mobile" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                                </div>

                                {/* GST Cert Section */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">GST Certificate</label>
                                    {formData.gstCertificateUrl && (
                                        <div className="mb-2 text-xs">
                                            <a href={formData.gstCertificateUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">
                                                View Current Certificate
                                            </a>
                                        </div>
                                    )}
                                    <input 
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setGstFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Upload to replace existing certificate.</p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">System Role</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-rani-500 bg-white text-sm font-bold"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                        disabled={isEditMode && !isSuperAdmin} // Only SuperAdmin can change roles of existing users
                                    >
                                        {Object.values(UserRole).map(role => (
                                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Password Field: Show if creating NEW user OR if Super Admin is editing */}
                                {(!isEditMode || isSuperAdmin) && (
                                    <Input 
                                        label={isEditMode ? "Reset Password (Optional)" : "Initial Password"} 
                                        type="password" 
                                        required={!isEditMode} 
                                        value={formData.password} 
                                        onChange={e => setFormData({...formData, password: e.target.value})} 
                                    />
                                )}

                                {/* Features Toggles */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ToggleSwitch 
                                        label="Account Approved (Active)" 
                                        checked={!!formData.isApproved} 
                                        onChange={val => setFormData({...formData, isApproved: val})} 
                                    />
                                    <ToggleSwitch 
                                        label="Pre-Book Club Access" 
                                        checked={!!formData.isPreBookApproved} 
                                        onChange={val => setFormData({...formData, isPreBookApproved: val})} 
                                    />
                                </div>

                                {/* Financials & Links - Only for relevant roles */}
                                {(formData.role === UserRole.RETAILER || formData.role === UserRole.DISTRIBUTOR) && (
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Financial Configuration</h4>
                                        <div className="grid grid-cols-2 gap-6">
                                            <Input label="Credit Limit (₹) - 0 for Infinite" type="number" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})} />
                                            <Input label="Current Outstanding (₹)" type="number" value={formData.outstandingDues} onChange={e => setFormData({...formData, outstandingDues: Number(e.target.value)})} />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gaddi Link</label>
                                                <select className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.gaddiId || ''} onChange={e => setFormData({...formData, gaddiId: e.target.value})}>
                                                    <option value="">-- None --</option>
                                                    {gaddiPartners.map(g => <option key={g.id} value={g.id}>{g.businessName}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Agent Link</label>
                                                <select className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.assignedAgentId || ''} onChange={e => setFormData({...formData, assignedAgentId: e.target.value})}>
                                                    <option value="">-- None --</option>
                                                    {agentPartners.map(a => <option key={a.id} value={a.id}>{a.fullName}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Distributor Link</label>
                                                <select className="w-full border border-gray-300 rounded-lg p-2 text-xs" value={formData.assignedDistributorId || ''} onChange={e => setFormData({...formData, assignedDistributorId: e.target.value})}>
                                                    <option value="">-- None --</option>
                                                    {distributorPartners.map(d => <option key={d.id} value={d.id}>{d.businessName || d.fullName}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4 flex justify-end gap-4">
                                    <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                    <Button disabled={isSaving}>{isSaving ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Create User')}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
