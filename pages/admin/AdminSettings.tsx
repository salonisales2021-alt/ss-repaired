
import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useToast } from '../../components/Toaster';

export const AdminSettings: React.FC = () => {
    const { toast } = useToast();
    const [gstKey, setGstKey] = useState(localStorage.getItem('SALONI_GST_API_KEY') || '');
    const [gstUrl, setGstUrl] = useState(localStorage.getItem('SALONI_GST_API_URL') || '');
    // PRE-CONFIGURED LIVE KEY
    const [razorpayKey, setRazorpayKey] = useState(localStorage.getItem('SALONI_RAZORPAY_KEY_ID') || 'rzp_live_S0uWvTrQbQVu8b');
    const [razorpayHandle, setRazorpayHandle] = useState(localStorage.getItem('SALONI_RAZORPAY_HANDLE') || '@saloni1390');

    const handleSaveConfig = () => {
        localStorage.setItem('SALONI_GST_API_KEY', gstKey);
        localStorage.setItem('SALONI_GST_API_URL', gstUrl);
        localStorage.setItem('SALONI_RAZORPAY_KEY_ID', razorpayKey);
        localStorage.setItem('SALONI_RAZORPAY_HANDLE', razorpayHandle);
        toast("System configuration updated successfully.", "success");
    };

    return (
        <div className="animate-fade-in max-w-4xl pb-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-sm text-gray-500 mb-8">Configure platform-wide rules and secure parameters.</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8 space-y-10">
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
