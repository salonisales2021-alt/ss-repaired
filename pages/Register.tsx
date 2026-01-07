import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { verifyGST, GSTDetails } from '../services/gstService';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { BrandLogo } from '../components/BrandLogo';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser } = useApp();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [identityInput, setIdentityInput] = useState('');
  const [identityType, setIdentityType] = useState<'GSTIN' | 'AADHAR' | 'MOBILE' | null>(null);

  const [gstData, setGstData] = useState<GSTDetails | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.RETAILER);
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    ownerName: '',
    businessName: '', 
    aadharNumber: ''
  });

  const handleIdentityVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let cleanInput = identityInput.trim().toUpperCase()
      .replace(/[\s\.\-]/g, '')
      .replace(/^(\+91|91)/, '');

    try {
        if (cleanInput.length === 15) {
            // Regex Validation for GSTIN
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(cleanInput)) {
                throw new Error("Invalid GSTIN format. Format required: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric.");
            }

            setIdentityType('GSTIN');
            const data = await verifyGST(cleanInput);
            setGstData(data);
            setFormData(prev => ({ ...prev, businessName: data.tradeName, mobile: data.gstin.substring(2, 12) }));
            setStep(2);
        } 
        else if (cleanInput.length === 12 && /^\d+$/.test(cleanInput)) {
            setIdentityType('AADHAR');
            setFormData(prev => ({ ...prev, aadharNumber: cleanInput }));
            setStep(2);
        } 
        else if (cleanInput.length === 10 && /^\d+$/.test(cleanInput)) {
            setIdentityType('MOBILE');
            setFormData(prev => ({ ...prev, mobile: cleanInput }));
            setStep(2);
        } 
        else {
             throw new Error("Invalid Format. Enter 15-digit GSTIN, 12-digit Aadhar, or 10-digit Mobile.");
        }
    } catch (err: any) {
        setError(err.message || 'Verification Failed');
    } finally {
        setLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
    }
    
    setLoading(true);

    const newUser: User = {
        // ID generated securely in db.ts
        id: '', 
        email: formData.email.trim(),
        fullName: formData.ownerName,
        businessName: gstData ? gstData.tradeName : formData.businessName,
        role: selectedRole, 
        gstin: identityType === 'GSTIN' ? gstData?.gstin : undefined,
        aadharNumber: formData.aadharNumber,
        mobile: formData.mobile,
        isApproved: false, 
        creditLimit: 0,
        outstandingDues: 0
    };

    const result = await registerUser(newUser, formData.password);

    if (result.success) {
        setStep(3);
    } else {
        setError(result.error || "Registration failed.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-10">
        <Link to="/" className="inline-block">
             <div className="flex flex-col items-center justify-center gap-4">
                <BrandLogo className="h-32" />
             </div>
        </Link>
        <h2 className="text-xl font-bold text-gray-900 mt-8">Partner Onboarding</h2>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-0"></div>
            {[1, 2, 3].map(s => (
                <div key={s} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s ? 'bg-rani-500 text-white shadow-xl' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>{s}</div>
            ))}
        </div>
      </div>

      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        {step === 1 && (
            <div className="p-10 animate-fade-in">
                <h3 className="text-xl font-black uppercase tracking-tight mb-4">Step 1: Identity Verification</h3>
                <p className="text-sm text-gray-600 mb-8">Verification ensures exclusive factory-direct access for genuine trade partners only.</p>
                <form onSubmit={handleIdentityVerify} className="space-y-6">
                    <Input 
                        label="GSTIN / Aadhar / Mobile" 
                        placeholder="Enter identification number..." 
                        value={identityInput} 
                        onChange={(e) => setIdentityInput(e.target.value)} 
                        required 
                        maxLength={15} // Enforced limit
                    />
                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100">{error}</div>}
                    <Button fullWidth disabled={loading} className="h-14 font-black uppercase tracking-widest">{loading ? 'Verifying...' : 'Authenticate Identity'}</Button>
                </form>
            </div>
        )}

        {step === 2 && (
            <div className="p-10 animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black uppercase tracking-tight">Step 2: Business Profile</h3>
                    <div className="flex items-center gap-4">
                        {gstData && (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border ${gstData.source === 'LIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                {gstData.source === 'LIVE' ? '✔ GOVT VERIFIED' : '⚠ SIMULATION MODE'}
                            </span>
                        )}
                        <button onClick={() => setStep(1)} className="text-[10px] font-black text-rani-600 underline uppercase">Back</button>
                    </div>
                </div>

                <form onSubmit={handleFinalSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Trade Designation</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                { role: UserRole.RETAILER, title: 'Retailer', desc: 'Buy to stock shop' },
                                { role: UserRole.LOCAL_TRADER, title: 'Local Trader', desc: 'Stock & Local Supply' },
                                { role: UserRole.DISTRIBUTOR, title: 'Distributor', desc: 'Strict Bulk Distribution' },
                                { role: UserRole.GADDI, title: 'Gaddi (Buying House)', desc: 'Financial & Logistics Hub' },
                                { role: UserRole.AGENT, title: 'Agent', desc: 'Contact & Contract Providers' },
                                { role: UserRole.CORPORATE, title: 'Corporate / Chainstore', desc: 'Multi-Location Retailers' },
                                { role: UserRole.INTERNATIONAL, title: 'International Client', desc: 'Import / Export' }
                            ].map(item => (
                                <div 
                                    key={item.role}
                                    onClick={() => setSelectedRole(item.role)}
                                    className={`p-4 border-2 rounded-2xl cursor-pointer transition-all ${selectedRole === item.role ? 'border-rani-500 bg-rani-50/50 ring-1 ring-rani-500' : 'border-gray-100 hover:border-gray-200'}`}
                                >
                                    <p className={`font-black text-xs uppercase ${selectedRole === item.role ? 'text-rani-600' : 'text-gray-800'}`}>{item.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                        <Input label="Business Legal Name" maxLength={50} required className="md:col-span-2" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} disabled={gstData?.source === 'LIVE'} />
                        <Input label="Owner Name" maxLength={50} required value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
                        <Input label="Mobile" maxLength={15} required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                        <Input label="Email Address" maxLength={60} type="email" required className="md:col-span-2" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <Input label="Set Password" maxLength={30} type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        <Input label="Confirm" maxLength={30} type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                    
                    <Button fullWidth disabled={loading} className="h-14 font-black uppercase tracking-widest shadow-xl shadow-rani-500/10">Apply for Access</Button>
                </form>
            </div>
        )}

        {step === 3 && (
             <div className="p-12 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner">✓</div>
                <h3 className="text-3xl font-black text-gray-800 mb-2">Application Received!</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-10">Your profile as a <strong>{selectedRole}</strong> is now under manual review by the Saloni Sales Admin team.</p>
                <Button onClick={() => navigate('/login')} fullWidth variant="outline" className="h-14 font-black uppercase tracking-widest">Back to Login</Button>
             </div>
        )}
      </div>
    </div>
  );
};