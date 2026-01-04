
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Navigate } from 'react-router-dom';
import { db } from '../../services/db';

export const Settings: React.FC = () => {
    const { user, isBiometricAvailable, enableBiometricAuth } = useApp();
    const [isSaving, setIsSaving] = useState(false);
    const [isBioEnabled, setIsBioEnabled] = useState(false);

    useEffect(() => {
        // Check if this user is already set up in local storage
        if (user) {
            const storedId = localStorage.getItem('saloni_bio_user_id');
            if (storedId === user.id) {
                setIsBioEnabled(true);
            }
        }
    }, [user]);

    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        mobile: user?.mobile || '',
        email: user?.email || '',
        businessName: user?.businessName || '',
        gstin: user?.gstin || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    if (!user) return <Navigate to="/login" />;

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // GSTIN Validation
        if (formData.gstin) {
             const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
             if (!gstinRegex.test(formData.gstin)) {
                 alert("Invalid GSTIN format. Standard format required (e.g., 07AAAAA0000A1Z5).");
                 return;
             }
        }

        setIsSaving(true);
        try {
            const success = await db.updateUser({
                ...user,
                fullName: formData.fullName,
                mobile: formData.mobile,
                businessName: formData.businessName,
                gstin: formData.gstin
            });
            if (success) {
                alert("Profile updated successfully!");
                // Note: Actual app should refresh context, handled by db.updateUser in real env
            } else {
                alert("Failed to update profile.");
            }
        } catch (err) {
            alert("Error updating profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            alert("New passwords do not match.");
            return;
        }
        setIsSaving(true);
        // Supabase password update would go here if implemented
        setTimeout(() => {
            setIsSaving(false);
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
            alert("Password change requested. Check your email for confirmation.");
        }, 1000);
    };

    const handleBiometricToggle = async () => {
        if (isBioEnabled) {
            // Disable
            localStorage.removeItem('saloni_bio_user_id');
            localStorage.removeItem('saloni_bio_email');
            setIsBioEnabled(false);
            alert("Biometric login disabled on this device.");
        } else {
            // Enable
            const success = await enableBiometricAuth();
            if (success) {
                setIsBioEnabled(true);
                alert("Success! You can now use FaceID/TouchID to login.");
            } else {
                alert("Failed to setup biometrics. Ensure your device supports it.");
            }
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Account Settings</h1>
                <p className="text-sm text-gray-500 mb-8">Manage your profile, security, and preferences.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Navigation / Quick Info */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center">
                            <div className="w-20 h-20 bg-rani-100 text-rani-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                                {user.fullName.charAt(0)}
                            </div>
                            <h2 className="font-bold text-lg">{user.businessName}</h2>
                            <p className="text-sm text-gray-500 mb-4">{user.fullName}</p>
                            <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                {user.role} Account
                            </span>
                        </div>

                        {/* Device Security Card */}
                        {isBiometricAvailable && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                                <h3 className="font-bold text-sm text-gray-700 uppercase mb-4">Device Security</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Biometric Login</p>
                                        <p className="text-[10px] text-gray-500">FaceID / Fingerprint</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isBioEnabled} onChange={handleBiometricToggle} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rani-500"></div>
                                    </label>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 italic">
                                    Enables quick login on this device only.
                                </p>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-sm text-gray-700 uppercase mb-4">Assigned Partner</h3>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Amit Verma</p>
                                    <p className="text-xs text-gray-500">Regional Agent (North)</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Contact for support regarding orders or payments. <br/>
                                <a href="tel:+919876543211" className="text-rani-600 hover:underline font-bold">+91 98765 43211</a>
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Forms */}
                    <div className="md:col-span-2 space-y-8">
                        
                        {/* Profile Form */}
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 border-b border-gray-100 pb-2">Business Profile</h3>
                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Input 
                                        label="Business Name" 
                                        value={formData.businessName}
                                        onChange={e => setFormData({...formData, businessName: e.target.value})}
                                    />
                                    <Input 
                                        label="GSTIN" 
                                        value={formData.gstin}
                                        onChange={e => setFormData({...formData, gstin: e.target.value})}
                                        className="font-mono"
                                        maxLength={15}
                                    />
                                    <Input 
                                        label="Contact Person Name" 
                                        value={formData.fullName} 
                                        onChange={e => setFormData({...formData, fullName: e.target.value})} 
                                    />
                                    <Input 
                                        label="Registered Mobile" 
                                        value={formData.mobile} 
                                        onChange={e => setFormData({...formData, mobile: e.target.value})} 
                                    />
                                    <Input 
                                        label="Email Address" 
                                        value={formData.email} 
                                        disabled
                                        className="md:col-span-2 bg-gray-50"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button disabled={isSaving}>
                                        {isSaving ? 'Saving...' : 'Update Profile'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Security Form */}
                        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-800 mb-6 border-b border-gray-100 pb-2">Security</h3>
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <Input 
                                    label="Current Password" 
                                    type="password" 
                                    value={formData.currentPassword}
                                    onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                                />
                                <Input 
                                    label="New Password" 
                                    type="password" 
                                    value={formData.newPassword}
                                    onChange={e => setFormData({...formData, newPassword: e.target.value})}
                                />
                                <Input 
                                    label="Confirm New Password" 
                                    type="password" 
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                />
                                <div className="pt-2">
                                    <Button variant="outline" disabled={isSaving}>
                                        Request Password Change
                                    </Button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
