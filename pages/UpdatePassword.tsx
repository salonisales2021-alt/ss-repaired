
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { db } from '../services/db';
import { supabase } from '../services/supabaseClient';

export const UpdatePassword: React.FC = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        // In a real scenario, Supabase handles the session exchange from the URL hash #access_token=...
        // We just need to check if we have a session to allow update.
        if (!supabase) return; // Mock mode just renders
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // User is signed in with a temporary token, ready to update password
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setMsg("Passwords do not match");
            return;
        }
        setLoading(true);
        const { success, error } = await db.updatePassword(password);
        setLoading(false);
        if (success) {
            alert("Password updated successfully. Please login.");
            navigate('/login');
        } else {
            setMsg(error || "Failed to update password");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Set New Password</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <Input 
                        label="New Password" 
                        type="password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required 
                    />
                    <Input 
                        label="Confirm Password" 
                        type="password" 
                        value={confirm} 
                        onChange={e => setConfirm(e.target.value)} 
                        required 
                    />
                    {msg && <p className="text-red-500 text-sm">{msg}</p>}
                    <Button fullWidth disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </div>
        </div>
    );
};
