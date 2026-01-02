
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { UserRole, User } from '../../types';
import { db, parseAIJson } from '../../services/db';
import { MOCK_AGENTS } from '../../services/mockData';
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

    // Edit Modal State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Staff Creation Modal State
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [staffData, setStaffData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        role: UserRole.ADMIN,
        password: ''
    });

    const isSuperAdmin = currentUser?.role === UserRole.SUPER_ADMIN;
    const gaddiPartners = useMemo(() => users.filter(u => u.role === UserRole.GADDI), [users]);

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

            const results = parseAIJson(response.text, []);
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

    const handleOpenEdit = (user: User) => {
        setSelectedUser({ ...user });
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            const success = await db.updateUser(selectedUser);
            if (success) {
                toast("Partner profile successfully updated.", "success");
                setSelectedUser(null);
            } else {
                toast("Database update failed.", "error");
            }
        } catch (e) {
            toast("Connection error occurred.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const newStaff: User = {
                id: `staff-${Date.now()}`,
                email: staffData.email,
                fullName: staffData.fullName,
                mobile: staffData.mobile,
                role: staffData.role,
                isApproved: true, // Staff are auto-approved
                creditLimit: 0,
                outstandingDues: 0
            };

            const result = await registerUser(newStaff, staffData.password);
            if (result.success) {
                toast(`Staff account for ${staffData.fullName} created.`, "success");
                setShowStaffModal(false);
                setStaffData({ fullName: '', email: '', mobile: '', role: UserRole.ADMIN, password: '' });
            } else {
                toast(result.error || "Failed to create staff account.", "error");
            }
        } catch (err) {
            toast("Error connecting to server.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto p-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Partner Ecosystem</h1>
                    <p className="text-sm text-gray-500">Manage staff roles, financial health, and access controls.</p>
                </div>
                <div className="flex gap-3">
                    {isSuperAdmin && (
                        <Button onClick={() => setShowStaffModal(true)} className="shadow-lg shadow-rani-500/20">
                            + Add Staff Account
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
                                        <div className="flex justify-between text-[10px] text-gray-500 font-bold">Credit: <span className="text-gray-900 font-black">₹{u.creditLimit?.toLocaleString()}</span></div>
                                        {u.isPreBookApproved && <span className="text-[9px] bg-gold-100 text-gold-700 border border-gold-200 px-1.5 py-0.5 rounded w-fit font-black uppercase">Pre-Book Club</span>}
                                    </div>
                                </td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-3">
                                        {!u.isApproved && (
                                            <Button size="sm" onClick={() => approveUser(u.id)} className="bg-red-600 hover:bg-red-700 h-8 px-4 text-[10px] font-black uppercase tracking-widest shadow-red-200">Unlock Account</Button>
                                        )}
                                        <Button size="sm" variant="outline" className="h-8 px-4 text-[10px] font-black uppercase tracking-widest hover:border-rani-500 hover:text-rani-600" onClick={() => handleOpenEdit(u)}>Manage</Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* STAFF CREATION MODAL */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-fade-in ring-1 ring-black/5">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-luxury-black text-white">
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight">Create Staff Account</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Backend Access Protocol</p>
                            </div>
                            <button onClick={() => setShowStaffModal(false)} className="text-gray-400 hover:text-white transition-colors">✕</button>
                        </div>
                        
                        <form onSubmit={handleCreateStaff} className="p-8 space-y-6">
                            <Input label="Full Name" required value={staffData.fullName} onChange={e => setStaffData({...staffData, fullName: e.target.value})} />
                            <Input label="Work Email" type="email" required value={staffData.email} onChange={e => setStaffData({...staffData, email: e.target.value})} />
                            <Input label="Mobile Number" required value={staffData.mobile} onChange={e => setStaffData({...staffData, mobile: e.target.value})} />
                            
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">System Role</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-rani-500 bg-white text-sm font-bold"
                                    value={staffData.role}
                                    onChange={e => setStaffData({...staffData, role: e.target.value as UserRole})}
                                >
                                    <option value={UserRole.ADMIN}>Administrator</option>
                                    <option value={UserRole.AGENT}>Sales Agent</option>
                                    <option value={UserRole.GADDI}>Gaddi Representative</option>
                                </select>
                            </div>

                            <Input label="Initial Password" type="password" required value={staffData.password} onChange={e => setStaffData({...staffData, password: e.target.value})} placeholder="Set temporary password" />

                            <div className="pt-4 flex gap-3">
                                <Button fullWidth disabled={isSaving}>
                                    {isSaving ? 'Provisioning...' : 'Provision Staff'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowStaffModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PARTNER EDIT MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in ring-1 ring-black/5">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-rani-500 rounded-2xl flex items-center justify-center text-white text-2xl font-script font-bold shadow-lg">S</div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Partner Configuration</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entity ID: {selectedUser.id}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-black">✕</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-gradient-to-br from-rani-500/10 to-transparent p-6 rounded-2xl border border-rani-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-black text-rani-900 uppercase text-xs tracking-widest">General Access</h3>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${selectedUser.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {selectedUser.isApproved ? 'AUTHORIZED' : 'LOCKED'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setSelectedUser({...selectedUser, isApproved: !selectedUser.isApproved})}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${selectedUser.isApproved ? 'bg-green-500' : 'bg-red-500'}`}
                                        >
                                            <span className={`${selectedUser.isApproved ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                        <span className="text-xs text-gray-600">Master Switch</span>
                                    </div>
                                </section>

                                <section className="bg-gradient-to-br from-gold-500/10 to-transparent p-6 rounded-2xl border border-gold-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-black text-gold-900 uppercase text-xs tracking-widest">Pre-Book Club</h3>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${selectedUser.isPreBookApproved ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {selectedUser.isPreBookApproved ? 'VIP MEMBER' : 'STANDARD'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => setSelectedUser({...selectedUser, isPreBookApproved: !selectedUser.isPreBookApproved})}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${selectedUser.isPreBookApproved ? 'bg-gold-500' : 'bg-gray-300'}`}
                                        >
                                            <span className={`${selectedUser.isPreBookApproved ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                        <span className="text-xs text-gray-600">Exclusive Line Access</span>
                                    </div>
                                </section>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Input label="Contact Person" value={selectedUser.fullName} onChange={e => setSelectedUser({...selectedUser, fullName: e.target.value})} />
                                <Input label="Business Legal Name" value={selectedUser.businessName || ''} onChange={e => setSelectedUser({...selectedUser, businessName: e.target.value})} />
                                <Input label="GSTIN (Tax ID)" value={selectedUser.gstin || ''} onChange={e => setSelectedUser({...selectedUser, gstin: e.target.value})} className="font-mono" />
                                <Input label="Verified Mobile" value={selectedUser.mobile || ''} onChange={e => setSelectedUser({...selectedUser, mobile: e.target.value})} />
                            </div>

                            { (selectedUser.role === UserRole.RETAILER || selectedUser.role === UserRole.DISTRIBUTOR) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-gray-50 rounded-2xl border border-gray-100">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Financial Protocols</h4>
                                        <Input label="Max Credit Limit (₹)" type="number" value={selectedUser.creditLimit} onChange={e => setSelectedUser({...selectedUser, creditLimit: Number(e.target.value)})} />
                                        <Input label="Current Statement Dues (₹)" type="number" value={selectedUser.outstandingDues} onChange={e => setSelectedUser({...selectedUser, outstandingDues: Number(e.target.value)})} />
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Partner Bindings</h4>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Primary Gaddi Partner</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-rani-500 bg-white text-sm font-bold"
                                                value={selectedUser.gaddiId || ''}
                                                onChange={e => setSelectedUser({...selectedUser, gaddiId: e.target.value})}
                                            >
                                                <option value="">-- No Gaddi Associated --</option>
                                                {gaddiPartners.map(g => (
                                                    <option key={g.id} value={g.id}>{g.businessName || g.fullName}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Sales Agent</label>
                                            <select 
                                                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-rani-500 bg-white text-sm font-bold"
                                                value={selectedUser.assignedAgentId || ''}
                                                onChange={e => setSelectedUser({...selectedUser, assignedAgentId: e.target.value})}
                                            >
                                                <option value="">-- Direct Sale / No Agent --</option>
                                                {MOCK_AGENTS.map(agent => (
                                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Confidential Admin Remarks</label>
                                <textarea 
                                    className="w-full border border-gray-200 rounded-2xl p-5 text-sm focus:ring-2 focus:ring-rani-500/20 outline-none h-32 bg-gray-50/30 font-medium"
                                    placeholder="Internal remarks on behavior or custom terms..."
                                    value={selectedUser.adminNotes || ''}
                                    onChange={e => setSelectedUser({...selectedUser, adminNotes: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 shrink-0">
                            <Button variant="outline" className="px-8 font-black uppercase tracking-widest text-xs" onClick={() => setSelectedUser(null)}>Discard</Button>
                            <Button onClick={handleSaveUser} disabled={isSaving} className="px-12 font-black uppercase tracking-widest text-xs shadow-xl shadow-rani-500/20">
                                {isSaving ? 'Syncing...' : 'Persist Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};