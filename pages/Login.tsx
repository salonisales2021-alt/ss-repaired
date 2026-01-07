
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { BrandLogo } from '../components/BrandLogo';
import { UserRole } from '../types';
import { db } from '../services/db';

type LoginStep = 'CREDENTIALS' | 'BIOMETRIC' | 'OTP' | 'FORGOT_PASSWORD' | 'TWO_FACTOR';

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
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const [bioStatus, setBioStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [savedBioEmail, setSavedBioEmail] = useState<string | null>(null);
  
  // Store credentials temporarily for 2FA verification
  const [pendingCreds, setPendingCreds] = useState<{id: string, pass: string} | null>(null);

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
    const passToUse = forceCreds ? forceCreds.pass : password.trim();

    // --- ADMIN 2FA INTERCEPTION ---
    if (isAdminRoute) {
        // 1. Verify Credentials First (Without setting app state)
        const { user: checkUser, error } = await db.signIn(idToUse, passToUse);
        
        if (error || !checkUser) {
            setErrorMsg(error || 'Invalid admin credentials');
            setLoading(false);
            return;
        }

        // 2. Role Check
        const allowedRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DISPATCH];
        if (!allowedRoles.includes(checkUser.role)) {
            setErrorMsg('Access Denied: Account is not an Administrator.');
            setLoading(false);
            return;
        }

        // 3. Initiate 2FA
        setPendingCreds({ id: idToUse, pass: passToUse });
        setLoading(false);
        setStep('TWO_FACTOR');
        
        // Simulate OTP send
        console.log("OTP Sent: 123456");
        // alert("Admin Security: Your OTP code is 123456"); // Using toast/UI instead of alert in production ideally
        return;
    }

    // --- STANDARD USER LOGIN ---
    const result = await login(idToUse, 'CUSTOMER', passToUse);
    setLoading(false);
    
    if (result.success) {
      const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
      proceedAfterLogin(userObj);
    } else {
      setErrorMsg(result.error === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : (result.error || 'Invalid credentials.'));
    }
  };

  const verifyAdmin2FA = async (method: 'OTP' | 'BIO') => {
      if (!pendingCreds) return;
      setLoading(true);
      setErrorMsg(null);

      let verified = false;

      if (method === 'OTP') {
          const code = otpValue.join('');
          if (code === '123456') verified = true; // Hardcoded Demo OTP
          else {
              setErrorMsg("Invalid OTP Code. Try '123456'");
              setLoading(false);
              return;
          }
      } else if (method === 'BIO') {
          // This calls the biometric service
          try {
              const bioResult = await biometricLogin();
              // Note: biometricLogin in AppContext also sets the user state if successful
              if (bioResult.success) {
                  // If biometric succeeds, we are already logged in via context
                  const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
                  proceedAfterLogin(userObj);
                  return;
              } else {
                  setErrorMsg("Biometric verification failed.");
                  setLoading(false);
                  return;
              }
          } catch (e) {
              setErrorMsg("Biometric error.");
              setLoading(false);
              return;
          }
      }

      if (verified) {
          // Finalize Login
          const result = await login(pendingCreds.id, 'ADMIN', pendingCreds.pass);
          if (result.success) {
              const userObj = JSON.parse(localStorage.getItem('saloni_active_user') || '{}');
              proceedAfterLogin(userObj);
          } else {
              setErrorMsg("Session creation failed.");
          }
      }
      setLoading(false);
  };

  const autofillAdmin = () => {
      setIdentifier('admin@salonisale.com');
      setPassword('password123');
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

  const handleOtpChange = (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newOtp = [...otpValue];
      newOtp[index] = value.slice(-1);
      setOtpValue(newOtp);
      
      // Auto focus next using refs
      if (value && index < 5) {
          otpRefs.current[index + 1]?.focus();
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
                      {/* ... existing role links ... */}
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
        
        {/* Back Button */}
        <button 
            onClick={() => {
                if (step === 'TWO_FACTOR') {
                    setStep('CREDENTIALS');
                    setErrorMsg(null);
                } else if (step === 'CREDENTIALS') {
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
            Back
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

                <form onSubmit={(e) => handleLogin(e)} className="space-y-6">
                    <Input label="Email Address" type="text" placeholder="user@company.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required className="rounded-xl h-14 font-bold" />
                    <Input label="Security Key" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl h-14" />
                    
                    <div className="flex justify-between items-center -mt-4">
                        {isAdminRoute && (
                            <button type="button" onClick={autofillAdmin} className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">
                                Auto-Fill Admin
                            </button>
                        )}
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

        {/* TWO FACTOR AUTHENTICATION STEP */}
        {step === 'TWO_FACTOR' && (
            <div className="animate-fade-in pt-8">
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-blue-50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-2">Admin Security</h3>
                    <p className="text-xs text-gray-500 max-w-[250px] mx-auto font-medium">
                        Two-factor authentication is required for administrative access.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-4 rounded-xl text-[11px] mb-6 font-bold bg-red-50 border border-red-200 text-red-700 animate-shake">
                        ⚠️ {errorMsg}
                    </div>
                )}

                <div className="space-y-8">
                    {/* OPTION A: BIOMETRIC */}
                    {isBiometricAvailable && (
                        <div className="space-y-4">
                            <Button 
                                fullWidth 
                                onClick={() => verifyAdmin2FA('BIO')} 
                                className="bg-luxury-black hover:bg-gray-800 h-14 rounded-xl flex items-center justify-center gap-3 shadow-lg"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-rani-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.59-4.18M5.55 17.55l-1 1" />
                                </svg>
                                <span className="uppercase tracking-widest text-xs font-bold">Verify with FaceID</span>
                            </Button>
                            
                            <div className="relative flex items-center py-2">
                                <div className="grow border-t border-gray-200"></div>
                                <span className="shrink-0 mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Or enter code</span>
                                <div className="grow border-t border-gray-200"></div>
                            </div>
                        </div>
                    )}

                    {/* OPTION B: OTP */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3 text-center">
                                Enter 6-Digit OTP sent to Email
                            </label>
                            <div className="flex gap-2 justify-center">
                                {otpValue.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => otpRefs.current[idx] = el}
                                        id={`otp-${idx}`}
                                        type="text"
                                        maxLength={1}
                                        className="w-10 h-14 border-2 border-gray-200 rounded-lg text-center text-xl font-bold focus:border-rani-500 focus:ring-4 focus:ring-rani-500/20 outline-none transition-all bg-gray-50 focus:bg-white"
                                        value={digit}
                                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !digit && idx > 0) {
                                                otpRefs.current[idx - 1]?.focus();
                                            }
                                            if (e.key === 'Enter') {
                                                verifyAdmin2FA('OTP');
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <Button 
                            fullWidth 
                            onClick={() => verifyAdmin2FA('OTP')} 
                            disabled={loading || otpValue.join('').length !== 6}
                            className="h-14 font-black uppercase tracking-widest shadow-xl shadow-rani-500/20"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </Button>
                        
                        <div className="text-center">
                            <button 
                                onClick={() => { 
                                    setOtpValue(['','','','','','']); 
                                    window.alert("OTP Resent: 123456"); 
                                }}
                                className="text-[10px] font-bold text-gray-400 hover:text-rani-600 uppercase tracking-widest"
                            >
                                Resend Code
                            </button>
                        </div>
                    </div>
                </div>
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
      </div>
    </div>
  );
};
