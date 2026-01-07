
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BrandLogo } from '../components/BrandLogo';
import { UserRole } from '../types';
import { db } from '../services/db';

type LoginStep = 'CREDENTIALS' | 'BIOMETRIC' | 'OTP' | 'FORGOT_PASSWORD';

export const Login: React.FC = () => {
  const { login, biometricLogin, isBiometricAvailable } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const roleParam = searchParams.get('role'); 
  const isAdminRoute = location.pathname.includes('/admin');

  // New State for Admin Sub-Profile
  const [adminProfile, setAdminProfile] = useState<'ADMIN' | 'DISPATCH' | null>(null);

  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [otpValue, setOtpValue] = useState(['', '', '', '', '', '']);
  const [bioStatus, setBioStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [savedBioEmail, setSavedBioEmail] = useState<string | null>(null);

  const showRoleSelection = !roleParam && !isAdminRoute;

  useEffect(() => {
      // Check if biometric is set up for this device
      const bioUser = localStorage.getItem('saloni_bio_email');
      if (bioUser) {
          setHasBiometricSetup(true);
          setSavedBioEmail(bioUser);
      }
  }, []);

  const getRoleTitle = () => {
    if (isAdminRoute) return adminProfile === 'DISPATCH' ? 'Dispatch Control' : 'Admin Control Center';
    if (roleParam === 'agent') return 'Agent Portal';
    if (roleParam === 'retailer') return 'Retailer Portal';
    if (roleParam === 'trader') return 'Local Trader Portal';
    if (roleParam === 'distributor') return 'Distributor Portal';
    if (roleParam === 'gaddi') return 'Gaddi Partner Portal';
    return 'B2B Partner Portal';
  };

  const handleLogin = async (e?: React.FormEvent, forceCreds?: { id: string, pass: string }) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const idToUse = forceCreds ? forceCreds.id : identifier.trim();
    const passToUse = forceCreds ? forceCreds.pass : password;

    const result = await login(idToUse, isAdminRoute ? 'ADMIN' : 'CUSTOMER', passToUse);
    setLoading(false);
    
    if (result.success) {
      const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
      
      // SUPER ADMIN SPECIAL FLOW
      if (userObj.role === UserRole.SUPER_ADMIN && userObj.fullName === 'Sarthak Huria') {
          setStep('BIOMETRIC');
          return;
      }

      proceedAfterLogin(userObj);
    } else {
      setErrorMsg(result.error === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : (result.error || 'Invalid credentials.'));
    }
  };

  const handleBiometricLogin = async () => {
      setLoading(true);
      setErrorMsg(null);
      
      try {
          const result = await biometricLogin();
          if (result.success) {
              const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
              proceedAfterLogin(userObj);
          } else {
              setErrorMsg(result.error || "Biometric login failed");
          }
      } catch (e) {
          setErrorMsg("Biometric verification failed on device.");
      } finally {
          setLoading(false);
      }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!identifier) {
          setErrorMsg("Please enter your email address.");
          return;
      }
      
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
          const result = await db.resetPasswordForEmail(identifier);
          if (result.success) {
              setSuccessMsg(`Password reset link sent to ${identifier}. Please check your email.`);
          } else {
              setErrorMsg(result.error || "Failed to send reset link. Please check the email.");
          }
      } catch (err) {
          setErrorMsg("An unexpected error occurred.");
      } finally {
          setLoading(false);
      }
  };

  const proceedAfterLogin = (userObj: any) => {
    if (isAdminRoute || userObj.role === UserRole.SUPER_ADMIN || userObj.role === UserRole.ADMIN || userObj.role === UserRole.DISPATCH) {
        navigate('/admin/dashboard');
    } else {
        if (userObj.role === 'AGENT') {
             navigate('/agent/dashboard');
        } else if (userObj.role === 'GADDI') {
             navigate('/logistics/dashboard');
        } else if (userObj.role === 'DISTRIBUTOR') {
             navigate('/distributor/dashboard');
        } else {
             navigate('/');
        }
    }
  };

  const simulateBiometric = () => {
      setBioStatus('SCANNING');
      setTimeout(() => {
          setBioStatus('SUCCESS');
          setTimeout(() => setStep('OTP'), 800);
      }, 2000);
  };

  const handleOtpChange = (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otpValue];
      newOtp[index] = value.slice(-1);
      setOtpValue(newOtp);
      
      // Auto focus next
      if (value && index < 5) {
          const nextInput = document.getElementById(`otp-${index + 1}`);
          nextInput?.focus();
      }
  };

  const verifyOtp = () => {
      const fullOtp = otpValue.join('');
      if (fullOtp.length === 6) {
          setLoading(true);
          setTimeout(() => {
              const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
              proceedAfterLogin(userObj);
          }, 1500);
      }
  };

  // Main Customer Role Selection Screen
  if (showRoleSelection) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
              <div className="max-w-5xl w-full">
                  <div className="text-center mb-16 animate-fade-in">
                      <div className="flex flex-col items-center justify-center mb-8">
                        <BrandLogo className="h-40" />
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-[0.2em] mt-8">Partner Selection</h2>
                      <p className="text-gray-500 text-sm mt-2 font-bold">Access factory direct supply chain</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
                      <Link to="/login?role=retailer" className="bg-white border border-gray-200 hover:border-rani-500 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-rani-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rani-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <span className="text-3xl">🏬</span>
                          </div>
                          <h3 className="text-xs font-black text-luxury-black uppercase tracking-widest">Retailer</h3>
                      </Link>

                      <Link to="/login?role=trader" className="bg-white border border-gray-200 hover:border-rani-500 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <span className="text-3xl">🤝</span>
                          </div>
                          <h3 className="text-xs font-black text-luxury-black uppercase tracking-widest">Trader</h3>
                      </Link>

                      <Link to="/login?role=distributor" className="bg-white border border-gray-200 hover:border-rani-500 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <span className="text-3xl">🛡️</span>
                          </div>
                          <h3 className="text-xs font-black text-luxury-black uppercase tracking-widest">Distributor</h3>
                      </Link>

                      <Link to="/login?role=agent" className="bg-white border border-gray-200 hover:border-rani-500 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <span className="text-3xl">💼</span>
                          </div>
                          <h3 className="text-xs font-black text-luxury-black uppercase tracking-widest">Agent</h3>
                      </Link>

                      <Link to="/login?role=gaddi" className="bg-white border border-gray-200 hover:border-rani-500 p-8 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col items-center text-center">
                          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                              <span className="text-3xl">🏛️</span>
                          </div>
                          <h3 className="text-xs font-black text-luxury-black uppercase tracking-widest">Gaddi</h3>
                      </Link>
                  </div>
                  
                  <div className="mt-12 flex flex-col items-center justify-center space-y-8">
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Partner?</p>
                        <Link to="/register" className="px-8 py-3 bg-rani-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-rani-700 transition-colors inline-block">
                            Apply for Dealership
                        </Link>
                      </div>

                      <div className="w-24 h-px bg-gray-200"></div>

                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Administrative Access</p>
                        <Link to="/admin/login" className="text-rani-500 font-black text-lg hover:underline mt-1 inline-block">Admin Login</Link>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Admin Profile Selection
  if (isAdminRoute && !adminProfile) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
              <div className="max-w-4xl w-full">
                  <div className="text-center mb-16 animate-fade-in">
                      <div className="flex flex-col items-center justify-center mb-8">
                        <BrandLogo className="h-32" />
                      </div>
                      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-[0.2em] mt-8">Internal Systems</h2>
                      <p className="text-gray-500 text-sm mt-2 font-bold">Select operational profile to continue</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                      <div onClick={() => setAdminProfile('ADMIN')} className="bg-white border-2 border-gray-200 hover:border-rani-500 p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group text-center">
                          <div className="w-20 h-20 bg-luxury-black text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl group-hover:scale-110 transition-transform">
                              ⚙️
                          </div>
                          <h3 className="text-lg font-black text-luxury-black uppercase tracking-widest mb-2">Admin</h3>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Full System Control</p>
                      </div>

                      <div onClick={() => setAdminProfile('DISPATCH')} className="bg-white border-2 border-gray-200 hover:border-blue-500 p-10 rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer group text-center">
                          <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-xl group-hover:scale-110 transition-transform">
                              🚚
                          </div>
                          <h3 className="text-lg font-black text-luxury-black uppercase tracking-widest mb-2">Dispatch Dept</h3>
                          <p className="text-xs text-gray-500 font-bold uppercase tracking-wide">Logistics & Shipping</p>
                      </div>
                  </div>
                  
                  <div className="mt-12 text-center">
                    <Link to="/login" className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-rani-500">← Back to Partner Login</Link>
                  </div>
              </div>
          </div>
      );
  }

  // Unified Login Form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white w-full max-w-md p-10 rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rani-500/5 rounded-full -mr-16 -mt-16"></div>
        
        {/* Back Button for All Steps except initial Admin/User select */}
        <button 
            onClick={() => {
                if (step === 'CREDENTIALS') {
                    isAdminRoute ? setAdminProfile(null) : navigate('/login');
                } else {
                    setStep('CREDENTIALS');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                }
            }}
            className="absolute top-8 left-8 text-gray-400 hover:text-rani-500 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Go Back
        </button>

        {step === 'CREDENTIALS' && (
            <div className="animate-fade-in">
                <div className="text-center mb-12 pt-10 flex flex-col items-center">
                    <BrandLogo className="h-32 mb-6" />
                    <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-2">
                        {getRoleTitle()}
                    </h2>
                    <div className="h-1 w-12 bg-rani-500 mx-auto rounded-full"></div>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-2xl text-[11px] mb-8 font-black uppercase tracking-tight leading-tight flex items-start gap-4 animate-shake bg-red-50 border border-red-200 text-red-700">
                        <div className="shrink-0 mt-0.5 text-lg">⚠️</div>
                        <div>{errorMsg}</div>
                    </div>
                )}

                {hasBiometricSetup && isBiometricAvailable && (
                    <div className="mb-8">
                        <Button fullWidth onClick={handleBiometricLogin} variant="secondary" className="h-14 font-black uppercase tracking-widest flex items-center justify-center gap-3">
                            <span className="text-xl">🙂</span> Login with FaceID
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">
                            Stored Account: {savedBioEmail}
                        </p>
                        <div className="relative mt-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500 font-bold text-xs uppercase">Or use password</span>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
                    <Input label="Email Address" type="text" placeholder="user@company.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="rounded-xl h-14 font-bold" />
                    <Input label="Security Key" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl h-14" />
                    
                    <div className="flex justify-between items-center -mt-4">
                        <button type="button" onClick={() => setStep('FORGOT_PASSWORD')} className="text-[10px] font-bold text-gray-400 hover:text-rani-600 uppercase tracking-widest ml-auto">Forgot Password?</button>
                    </div>

                    <Button fullWidth disabled={loading} className="rounded-xl h-16 shadow-2xl shadow-rani-500/20 font-black uppercase tracking-[0.2em] text-sm italic">
                        {loading ? 'Verifying...' : 'Unlock Portal'}
                    </Button>
                </form>

                {!isAdminRoute && (
                    <div className="mt-6 text-center">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">New Business?</p>
                        <Link to="/register" className="text-xs font-black text-rani-600 hover:text-rani-700 underline decoration-2 underline-offset-4 transition-colors">
                            Register for B2B Access
                        </Link>
                    </div>
                )}
            </div>
        )}

        {step === 'FORGOT_PASSWORD' && (
            <div className="animate-fade-in pt-12">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Recover Account</h3>
                    <p className="text-xs text-gray-500 max-w-[250px] mx-auto">
                        Enter your registered email to receive a password reset link.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-xl text-[11px] mb-6 font-bold bg-red-50 border border-red-200 text-red-700">
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div className="p-4 rounded-xl text-[11px] mb-6 font-bold bg-green-50 border border-green-200 text-green-700">
                        {successMsg}
                    </div>
                )}

                {!successMsg && (
                    <form onSubmit={handleForgotPassword} className="space-y-6">
                        <Input 
                            label="Email Address" 
                            type="email" 
                            placeholder="user@company.com" 
                            value={identifier} 
                            onChange={(e) => setIdentifier(e.target.value)} 
                            required 
                            className="rounded-xl h-14 font-bold" 
                        />
                        <Button fullWidth disabled={loading} className="rounded-xl h-14 font-black uppercase tracking-widest shadow-lg">
                            {loading ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                    </form>
                )}
                
                {successMsg && (
                    <Button fullWidth onClick={() => setStep('CREDENTIALS')} className="rounded-xl h-14 font-black uppercase tracking-widest shadow-lg mt-4">
                        Back to Login
                    </Button>
                )}
            </div>
        )}

        {step === 'BIOMETRIC' && (
            <div className="text-center py-10 animate-fade-in flex flex-col items-center">
                <div className="w-20 h-20 bg-rani-500 rounded-full flex items-center justify-center mb-8 shadow-2xl relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 text-white transition-all ${bioStatus === 'SCANNING' ? 'animate-pulse scale-110' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 20a10.003 10.003 0 006.239-2.148l.054.09m-3.44 2.04C13.101 17.799 12.1 14.517 12.1 11m0 0V7m0 0a2 2 0 100-4 2 2 0 000 4zm-7.143 5.252a9.96 9.96 0 011.836-5.068m11.233 4.238a9.96 9.96 0 00-1.836-5.068m-5.633 4.238l.003.033" />
                    </svg>
                    {bioStatus === 'SCANNING' && <div className="absolute inset-0 border-4 border-rani-300 rounded-full animate-ping opacity-25"></div>}
                </div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Biometric Lock</h3>
                <p className="text-sm text-gray-500 mb-10">Scan your fingerprint or face to continue.</p>
                
                {bioStatus === 'SUCCESS' ? (
                    <div className="text-green-500 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Identity Confirmed
                    </div>
                ) : (
                    <Button onClick={simulateBiometric} disabled={bioStatus === 'SCANNING'} className="px-12 h-14 font-black uppercase tracking-widest shadow-xl shadow-rani-500/20">
                        {bioStatus === 'SCANNING' ? 'Authenticating...' : 'Start Scan'}
                    </Button>
                )}
            </div>
        )}

        {step === 'OTP' && (
            <div className="animate-fade-in py-6">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">WhatsApp OTP</h3>
                    <p className="text-xs text-gray-500 max-w-[250px] mx-auto">
                        Verification code sent to registered mobile
                    </p>
                </div>

                <div className="flex justify-between gap-2 mb-8">
                    {otpValue.map((digit, idx) => (
                        <input 
                            key={idx}
                            id={`otp-${idx}`}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            className="w-12 h-14 bg-gray-50 border-2 border-gray-200 rounded-xl text-center text-xl font-black focus:border-rani-500 focus:bg-white outline-none transition-all shadow-sm"
                        />
                    ))}
                </div>

                <Button fullWidth disabled={loading || otpValue.join('').length < 6} onClick={verifyOtp} className="h-14 font-black uppercase tracking-widest shadow-xl shadow-rani-500/20">
                    {loading ? 'Confirming...' : 'Verify & Enter'}
                </Button>
                
                <p className="text-center mt-6">
                    <button className="text-[10px] font-black text-gray-400 hover:text-rani-500 uppercase tracking-widest transition-colors">Resend via WhatsApp</button>
                </p>
            </div>
        )}
      </div>
    </div>
  );
};
