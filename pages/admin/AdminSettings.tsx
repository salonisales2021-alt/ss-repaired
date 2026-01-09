
import React from 'react';

export const AdminSettings: React.FC = () => {
    return (
        <div className="animate-fade-in max-w-4xl pb-12 p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">System Settings</h1>
            <p className="text-sm text-gray-500 mb-8">Platform Configuration</p>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-8">
                <div className="bg-green-50 p-6 rounded-xl border border-green-100 mb-8">
                    <h3 className="font-bold text-green-800 mb-2">Environment Configuration</h3>
                    <p className="text-sm text-green-700">
                        The application is configured via immutable environment variables.
                        Runtime changes are disabled for security.
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1">Database Status</label>
                        <div className="text-lg font-bold text-gray-800">Connected (Supabase)</div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1">AI Service Status</label>
                        <div className="text-lg font-bold text-gray-800">Active (Edge Functions)</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
