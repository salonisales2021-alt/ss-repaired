
import React, { useState, useEffect } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toaster';
import { GoogleGenAI } from "@google/genai";

export const AdminSettings: React.FC = () => {
    const { toast } = useToast();
    
    // DB Configuration State
    const [sbUrl, setSbUrl] = useState(localStorage.getItem('VITE_SUPABASE_URL') || '');
    const [sbKey, setSbKey] = useState(localStorage.getItem('VITE_SUPABASE_ANON_KEY') || '');

    // External Integration State
    const [gstKey, setGstKey] = useState(localStorage.getItem('SALONI_GST_API_KEY') || '');
    const [gstUrl, setGstUrl] = useState(localStorage.getItem('SALONI_GST_API_URL') || '');
    const [razorpayKey, setRazorpayKey] = useState(localStorage.getItem('SALONI_RAZORPAY_KEY_ID') || 'rzp_live_S0uWvTrQbQVu8b');
    const [razorpayHandle, setRazorpayHandle] = useState(localStorage.getItem('SALONI_RAZORPAY_HANDLE') || '@saloni1390');

    // AI Studio State
    const [aiStudioAvailable, setAiStudioAvailable] = useState(false);
    const [aiKeyLinked, setAiKeyLinked] = useState(false);
    const [isTestingAi, setIsTestingAi] = useState(false);
    const [aiErrorType, setAiErrorType] = useState<'NONE' | 'INVALID_KEY' | 'OTHER'>('NONE');

    useEffect(() => {
        // Check for AI Studio Integration (IDX/Project IDX environment)
        const checkAi = async () => {
            const aistudio = (window as any).aistudio;
            if (aistudio) {
                setAiStudioAvailable(true);
                const hasKey = await aistudio.hasSelectedApiKey();
                setAiKeyLinked(hasKey);
            }
        };
        checkAi();
    }, []);

    const handleConnectAi = async () => {
        const aistudio = (window as any).aistudio;
        if (aistudio) {
            try {
                await aistudio.openSelectKey();
                setAiKeyLinked(true);
                toast("AI Studio Project Linked Successfully!", "success");
                setTimeout(() => window.location.reload(), 1000);
            } catch (e) {
                toast("Failed to link AI Studio project.", "error");
            }
        }
    };

    const handleTestAiConnection = async () => {
        setIsTestingAi(true);
        setAiErrorType('NONE');
        try {
            const apiKey = process.env.API_KEY;
            
            if (!apiKey) throw new Error("API Key environment variable is missing.");
            
            // Common configuration errors check
            if (apiKey.includes("your_google_gemini_key") || apiKey.includes("API_KEY")) {
                 setAiErrorType('INVALID_KEY');
                 throw new Error("Placeholder detected. Please update your environment variable with a real key.");
            }

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: 'Ping. Reply with "Connected" only.',
            });
            
            if (response.text?.includes("Connected")) {
                toast("✅ AI Connection Verified! Gemini 3 Flash is active.", "success");
            } else {
                toast("⚠️ AI Connected but returned unexpected response.", "warning");
            }
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Invalid API Key";
            
            if (e.toString().includes("400") || e.toString().includes("API_KEY_INVALID")) {
                setAiErrorType('INVALID_KEY');
                msg = "API Key is Invalid or Locked by Google.";
            } else {
                setAiErrorType('OTHER');
            }
            
            toast(`❌ Connection Failed: ${msg}`, "error");
        } finally {
            setIsTestingAi(false);
        }
    };

    const handleSaveConfig = () => {
        // Save External Integrations
        localStorage.setItem('SALONI_GST_API_KEY', gstKey);
        localStorage.setItem('SALONI_GST_API_URL', gstUrl);
        localStorage.setItem('SALONI_RAZORPAY_KEY_ID', razorpayKey);
        localStorage.setItem('SALONI_RAZORPAY_HANDLE', razorpayHandle);

        // Save DB Config & Handle Reload
        const oldUrl = localStorage.getItem('VITE_SUPABASE_URL');
        let needsReload = false;

        if (sbUrl && sbKey) {
            localStorage.setItem('VITE_SUPABASE_URL', sbUrl);
            localStorage.setItem('VITE_SUPABASE_ANON_KEY', sbKey);
            if (oldUrl !== sbUrl) needsReload = true;
        } else {
            if (oldUrl) {
                localStorage.removeItem('VITE_SUPABASE_URL');
                localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
                needsReload = true;
            }
        }

        toast("System configuration updated successfully.", "success");
        
        if (needsReload) {
            if (confirm("Database connection settings changed. Reload app to apply Live Mode?")) {
                window.location.reload();
            }
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl pb-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-sm text-gray-500 mb-8">Configure platform-wide rules and secure parameters.</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 space-y-10">
                    
                    {/* LIVE DB CONNECTION SECTION */}
                    <section className="bg-blue-50/50 -mx-8 px-8 py-8 border-b border-blue-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-blue-800 uppercase tracking-[0.2em]">Live Database Connection</h3>
                                <p className="text-xs text-blue-600 mt-1">Connect to your Supabase project to enable persistent data storage.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Supabase URL" 
                                placeholder="https://your-project.supabase.co" 
                                value={sbUrl}
                                onChange={(e) => setSbUrl(e.target.value)}
                                className="bg-white"
                            />
                            <Input 
                                label="Supabase Anon Key" 
                                type="password" 
                                placeholder="public-anon-key" 
                                value={sbKey}
                                onChange={(e) => setSbKey(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </section>

                    {/* AI STUDIO INTEGRATION */}
                    <section className="bg-purple-50/50 -mx-8 px-8 py-8 border-b border-purple-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-purple-800 uppercase tracking-[0.2em]">AI Studio Connection</h3>
                                <p className="text-xs text-purple-600 mt-1">Manage Google Gemini API connection for AI features.</p>
                            </div>
                        </div>
                        
                        <div className="bg-white p-6 rounded-xl border border-purple-200">
                            {aiStudioAvailable ? (
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`w-3 h-3 rounded-full ${aiKeyLinked ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <h4 className="font-bold text-gray-800">
                                                {aiKeyLinked ? 'Project Linked Successfully' : 'No Project Linked'}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-gray-500 max-w-md">
                                            {aiKeyLinked 
                                                ? 'Your Google Cloud Project is connected. AI features (Veo, Imagen, Gemini Flash) are active.' 
                                                : 'Link your Google Cloud project to enable AI features like Visual Scout and Smart Stocker.'}
                                        </p>
                                    </div>
                                    <Button onClick={handleConnectAi} className="bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200">
                                        {aiKeyLinked ? 'Switch Project' : 'Link Google AI Studio'}
                                    </Button>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className={`w-3 h-3 rounded-full ${process.env.API_KEY ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                                <h4 className="font-bold text-gray-800">Manual Environment Configuration</h4>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-2">
                                                Status: {process.env.API_KEY ? <span className="text-green-600 font-bold">Configured & Active</span> : <span className="text-red-500 font-bold">Missing Key</span>}
                                            </p>
                                            <div className="bg-gray-100 p-3 rounded font-mono text-xs text-gray-600 mb-4 inline-block max-w-md">
                                                To secure your key, set it in <strong>.env</strong> or Vercel Settings. Do NOT hardcode it.
                                            </div>
                                            {aiErrorType === 'INVALID_KEY' && (
                                                <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-xs text-red-800">
                                                    <strong>❌ API KEY REVOKED OR INVALID</strong><br/>
                                                    Your key has been locked (likely due to exposure).<br/>
                                                    1. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Generate a new key here</a>.<br/>
                                                    2. Update your Vercel/Netlify Environment Variables.<br/>
                                                    3. Redeploy the application.
                                                </div>
                                            )}
                                            <div className="text-[10px] text-gray-400 mt-2">
                                                Security Tip: Restrict this key to your domain (e.g., salonisales.com) in Google Cloud Console.
                                            </div>
                                        </div>
                                        {process.env.API_KEY && (
                                            <Button size="sm" variant="outline" onClick={handleTestAiConnection} disabled={isTestingAi} className="border-purple-200 text-purple-700 hover:bg-purple-50">
                                                {isTestingAi ? 'Verifying...' : '⚡ Test Connection'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Global Configuration</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <Input label="Default GST Rate (%)" type="number" defaultValue="5" />
                            <Input label="Platform Currency" defaultValue="INR (₹)" disabled />
                            <Input label="Min Bulk Order Quantity" type="number" defaultValue="12" />
                            <Input label="Support Email" defaultValue="salonisales2021@gmail.com" />
                        </div>
                    </section>

                    <section className="bg-gray-50/50 -mx-8 px-8 py-8 border-y border-gray-100">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">External Integrations</h3>
                        <div className="space-y-6">
                            
                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    💳 Payment Gateway (Razorpay)
                                </h4>
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <Input 
                                            label="Live Key ID (Public)" 
                                            placeholder="rzp_live_xxxxxxxx"
                                            value={razorpayKey}
                                            onChange={(e) => setRazorpayKey(e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 italic mt-1">
                                            This key enables the payment popup. <strong>Note:</strong> Key Secret is NOT required here for security reasons.
                                        </p>
                                    </div>
                                    
                                    <div className="relative flex items-center py-2">
                                        <div className="grow border-t border-gray-200"></div>
                                        <span className="shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">OR</span>
                                        <div className="grow border-t border-gray-200"></div>
                                    </div>

                                    <div>
                                        <Input 
                                            label="Payment Page Handle (Fallback)" 
                                            placeholder="@yourhandle"
                                            value={razorpayHandle}
                                            onChange={(e) => setRazorpayHandle(e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-gray-500 italic mt-1">
                                            Redirects to: <strong>razorpay.me/{razorpayHandle}</strong> if popup fails.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    🏛️ Real-time GST Verification
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    <Input 
                                        label="GST API Provider URL" 
                                        placeholder="https://api.provider.com/verify"
                                        value={gstUrl}
                                        onChange={(e) => setGstUrl(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                    <Input 
                                        label="API Key / Secret" 
                                        type="password" 
                                        placeholder="Enter provider secret key"
                                        value={gstKey}
                                        onChange={(e) => setGstKey(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 italic">
                                        Leave empty to use <strong>Simulation Mode</strong> (Mock Data) for testing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button variant="outline">Reset Defaults</Button>
                        <Button className="px-10" onClick={handleSaveConfig}>Save Configuration</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminSettings;
