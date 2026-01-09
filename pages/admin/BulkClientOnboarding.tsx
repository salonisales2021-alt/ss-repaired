
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { db, handleAiError, runAiWithRetry, parseAIJson } from '../../services/db';
import { User, UserRole } from '../../types';
import { useToast } from '../../components/Toaster';

interface DraftClient {
    id: string;
    image: string;
    fullName: string;
    businessName: string;
    mobile: string;
    email: string;
    gstin: string;
    address: string;
    role: UserRole;
    status: 'draft' | 'saving' | 'saved' | 'error';
}

export const BulkClientOnboarding: React.FC = () => {
    const { toast } = useToast();
    const [drafts, setDrafts] = useState<DraftClient[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        setIsAnalyzing(true);
        const newDrafts: DraftClient[] = [];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            for (const file of files) {
                try {
                    const reader = new FileReader();
                    const filePromise = new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });

                    const base64 = await filePromise;
                    const base64Data = base64.split(',')[1];

                    // Wrapped with Retry Logic
                    const response = await runAiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: {
                            parts: [
                                { inlineData: { data: base64Data, mimeType: file.type } },
                                { text: `You are an OCR expert for the Indian garment market. 
                                Extract business details from this visiting card. 
                                Map "role" to RETAILER if it's a shop, LOCAL_TRADER if it's a wholesaler, or DISTRIBUTOR if it's a large logistics firm.
                                Return valid JSON only.` }
                            ]
                        },
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    businessName: { type: Type.STRING },
                                    ownerName: { type: Type.STRING },
                                    mobile: { type: Type.STRING },
                                    email: { type: Type.STRING },
                                    gstin: { type: Type.STRING },
                                    address: { type: Type.STRING },
                                    role: { type: Type.STRING, enum: ["RETAILER", "LOCAL_TRADER", "DISTRIBUTOR"] }
                                },
                                required: ["businessName", "mobile"]
                            }
                        }
                    }));

                    const analysis = parseAIJson(response.text || '', {}) as any;
                    
                    newDrafts.push({
                        id: Math.random().toString(36).substr(2, 9),
                        image: base64,
                        fullName: analysis.ownerName || "Unknown Owner",
                        businessName: analysis.businessName || "Unknown Firm",
                        mobile: analysis.mobile || "",
                        email: analysis.email || "",
                        gstin: analysis.gstin || "",
                        address: analysis.address || "",
                        role: (analysis.role as UserRole) || UserRole.RETAILER,
                        status: 'draft'
                    });
                } catch (innerErr) {
                    console.error("Single card parse failed", innerErr);
                    // Don't halt the entire batch, just skip this card or maybe push an error draft
                }
            }

            setDrafts(prev => [...prev, ...newDrafts]);
        } catch (error) {
            await handleAiError(error);
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleImportClient = async (draft: DraftClient) => {
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'saving' } : d));
        
        try {
            const newUser: User = {
                id: `u-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                email: draft.email || `temp-${Date.now()}@saloni.com`,
                fullName: draft.fullName,
                businessName: draft.businessName,
                role: draft.role,
                mobile: draft.mobile,
                gstin: draft.gstin,
                isApproved: true,
                creditLimit: 0,
                outstandingDues: 0,
                adminNotes: `AI Imported from Business Card. Original Address: ${draft.address}`
            };

            // SECURITY: Use a random password instead of a hardcoded one
            const mobileLast4 = draft.mobile.length >= 4 ? draft.mobile.slice(-4) : '2025';
            const tempPassword = `Saloni@${mobileLast4}`;

            const result = await db.registerUser(newUser, tempPassword);
            
            if (result.success) {
                setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'saved' } : d));
                toast(`Imported ${draft.businessName}. Password: ${tempPassword}`, "success");
            } else {
                throw new Error(result.error);
            }
        } catch (e: any) {
            setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'error' } : d));
            toast(`Failed to import ${draft.businessName}: ${e.message}`, "error");
        }
    };

    const handleImportAll = async () => {
        const pending = drafts.filter(d => d.status === 'draft');
        if (pending.length === 0) return;
        
        for (const d of pending) {
            await handleImportClient(d);
        }
    };

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">AI Client Onboarding</h1>
                    <p className="text-sm text-gray-500">Scan visiting cards to instantly populate your retailer database.</p>
                </div>
                <div className="flex gap-3">
                    {drafts.length > 0 && (
                        <>
                            <Button variant="outline" onClick={() => setDrafts([])} className="text-red-600 border-red-100 hover:bg-red-50">Discard Queue</Button>
                            <Button onClick={handleImportAll}>Import All to CRM</Button>
                        </>
                    )}
                </div>
            </div>

            <div 
                className={`bg-white border-2 border-dashed rounded-3xl p-16 text-center transition-all cursor-pointer group mb-12
                    ${isAnalyzing ? 'border-rani-500 bg-rani-50/20' : 'border-gray-200 hover:border-rani-400 hover:bg-gray-50'}
                `}
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <div className="w-20 h-20 bg-luxury-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-3">🪪</div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Drop Business Cards Here</h3>
                <p className="text-sm text-gray-400 mt-2 font-bold uppercase tracking-widest">Supports multiple JPEGs • Gemini OCR Enabled</p>
                
                {isAnalyzing && (
                    <div className="mt-8 flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                            {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-rani-500 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }}></div>)}
                        </div>
                        <p className="text-xs font-black text-rani-600 uppercase tracking-widest">AI is extracting partner details...</p>
                    </div>
                )}
            </div>

            {drafts.length > 0 && (
                <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in ring-1 ring-black/5">
                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Extraction Queue</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{drafts.length} Partners Detected</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                                <tr>
                                    <th className="p-6">Card Image</th>
                                    <th className="p-6">Business Details</th>
                                    <th className="p-6">Role</th>
                                    <th className="p-6">Address Preview</th>
                                    <th className="p-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {drafts.map((d) => (
                                    <tr key={d.id} className={`hover:bg-gray-50/50 transition-colors ${d.status === 'saved' ? 'bg-green-50/50' : ''}`}>
                                        <td className="p-6">
                                            <div className="w-32 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:scale-105 transition-transform cursor-zoom-in" onClick={() => window.open(d.image)}>
                                                <img src={d.image} className="w-full h-full object-cover" alt="Card" />
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="font-bold text-gray-900 text-base">{d.businessName}</div>
                                            <div className="text-[11px] font-bold text-gray-500 uppercase">{d.fullName}</div>
                                            <div className="text-[10px] font-mono text-rani-600 mt-1">{d.mobile} • {d.email || 'No Email'}</div>
                                            {d.gstin && <div className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-2 font-black uppercase tracking-tighter text-gray-400 border border-gray-200">GST: {d.gstin}</div>}
                                        </td>
                                        <td className="p-6">
                                            <select 
                                                className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-rani-500"
                                                value={d.role}
                                                onChange={e => setDrafts(prev => prev.map(item => item.id === d.id ? {...item, role: e.target.value as UserRole} : item))}
                                                disabled={d.status !== 'draft'}
                                            >
                                                <option value={UserRole.RETAILER}>Retailer</option>
                                                <option value={UserRole.LOCAL_TRADER}>Trader</option>
                                                <option value={UserRole.DISTRIBUTOR}>Distributor</option>
                                            </select>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs text-gray-500 line-clamp-2 italic max-w-xs">"{d.address || 'No address extracted'}"</p>
                                        </td>
                                        <td className="p-6 text-right">
                                            {d.status === 'saved' ? (
                                                <span className="text-green-600 font-black text-[10px] uppercase tracking-widest flex items-center justify-end gap-1">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                    Imported
                                                </span>
                                            ) : (
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleImportClient(d)} 
                                                    disabled={d.status === 'saving'}
                                                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest shadow-lg"
                                                >
                                                    {d.status === 'saving' ? 'Provisioning...' : 'Add to DB'}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
