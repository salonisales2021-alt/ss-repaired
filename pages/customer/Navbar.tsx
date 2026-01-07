
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from '../../components/NotificationCenter';
import { GoogleGenAI } from "@google/genai";
import { BrandLogo } from '../../components/BrandLogo';

// Helper component
const SidebarItem = ({ to, icon, label, onClick, badge, className }: any) => (
    <li>
        <Link 
          to={to} 
          className={`flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-rani-50 hover:text-rani-700 rounded-xl transition-all duration-200 group font-medium ${className || ''}`}
          onClick={onClick}
        >
            <span className="text-gray-400 group-hover:text-rani-500 transition-colors">
                {icon}
            </span>
            <span className="flex-1">{label}</span>
            {badge && <span className="bg-rani-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{badge}</span>}
        </Link>
    </li>
);

// Icons extracted to prevent JSX nesting errors
const NavIcons = {
    Home: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
    Shop: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
    PreBook: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    QuickOrder: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
    VisualScout: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    TV: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    Orders: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
    Ledger: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Wishlist: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
    Marketing: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
    Design: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
    Stocker: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Visit: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    Support: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Partners: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    Settings: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
};

export const CustomerNavbar: React.FC = () => {
  const { user, cart, logout, selectedClient, selectClient, setTutorialOpen } = useApp();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; 
      setTimeout(() => {
          if (closeButtonRef.current) {
              closeButtonRef.current.focus();
          }
      }, 100);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const isSkuLike = /^[A-Z0-9-]{3,10}$/i.test(searchTerm.trim()) && /\d/.test(searchTerm);

    if (!isSkuLike) {
        setIsSemanticSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            const prompt = `You are a smart search assistant for a B2B Kids Clothing App (Saloni Sales).
            User Query: "${searchTerm}"
            
            Task: Expand this query into a list of 5-8 relevant search tokens.
            1. Translate Hindi/local terms to English (e.g., "Shaadi" -> "Wedding, Ethnic").
            2. Add synonyms for colors (e.g., "Crimson" -> "Red, Maroon").
            3. Add categories (e.g., "Frock" -> "Western, Dress, Gown").
            4. Keep specific SKU codes if present.
            
            Output Format: Return ONLY a comma-separated string of keywords.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            
            const refined = response.text?.trim() || searchTerm;
            
            const params = new URLSearchParams();
            params.append('search', refined);
            if (searchCategory && searchCategory !== 'All') params.append('cat', searchCategory);
            navigate(`/shop?${params.toString()}`);

        } catch (err) {
            const params = new URLSearchParams();
            params.append('search', searchTerm);
            if (searchCategory && searchCategory !== 'All') params.append('cat', searchCategory);
            navigate(`/shop?${params.toString()}`);
        } finally {
            setIsSemanticSearching(false);
        }
    } else {
        const params = new URLSearchParams();
        params.append('search', searchTerm);
        if (searchCategory && searchCategory !== 'All') params.append('cat', searchCategory);
        navigate(`/shop?${params.toString()}`);
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice search is not supported in this browser. Please use Chrome.");
        return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSearchTerm(transcript);
        navigate(`/shop?search=${encodeURIComponent(transcript)}`);
    };
    recognition.start();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsAnalyzingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          const base64data = reader.result?.toString().split(',')[1];
          if (!base64data) return;
          try {
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: {
                      parts: [
                          { inlineData: { mimeType: file.type, data: base64data } },
                          { text: "Describe the fashion item in this image in 3-4 simple keywords for search (e.g. 'Red Velvet Lehenga', 'Blue Cotton Frock'). Return ONLY the keywords." }
                      ]
                  }
              });
              const keywords = response.text?.trim();
              if (keywords) {
                  setSearchTerm(keywords);
                  navigate(`/shop?search=${encodeURIComponent(keywords)}`);
              }
          } catch (error) { console.error(error); } 
          finally {
              setIsAnalyzingImage(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsDataURL(file);
  };

  return (
    <>
    <div className="h-1 w-full bg-gradient-to-r from-rani-600 via-gold-500 to-rani-600"></div>
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm font-sans border-b border-gold-100">
      {selectedClient && (
          <div className="bg-gold-50 text-gold-800 py-2 px-4 text-center text-sm font-bold flex justify-center items-center gap-4 border-b border-gold-200">
              <span className="truncate">⚠️ On behalf of: {selectedClient.businessName}</span>
              <button onClick={() => { selectClient(null); navigate('/agent/dashboard'); }} className="bg-white border border-gold-300 text-gold-800 px-3 py-0.5 rounded text-xs uppercase hover:bg-gold-50">Exit Proxy</button>
          </div>
      )}
      
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-4 items-center justify-between">
            {/* Left: Menu & Logo */}
            <div className="flex items-center gap-4 shrink-0">
                <button 
                    onClick={() => setIsMenuOpen(true)} 
                    className="p-2 -ml-2 text-luxury-black hover:text-rani-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rani-500 rounded-lg"
                    aria-label="Open Menu"
                    aria-expanded={isMenuOpen ? "true" : "false"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <Link to="/" className="flex items-center shrink-0 focus:outline-none focus:ring-2 focus:ring-rani-500 rounded-lg">
                    <BrandLogo className="h-12 md:h-14" />
                </Link>
            </div>

            {/* Center: Search (Desktop) */}
            {user ? (
                <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-auto relative group">
                    <div className={`flex bg-white border rounded-full overflow-hidden w-full transition-all shadow-sm ${isSemanticSearching ? 'border-purple-500 ring-2 ring-purple-50' : (isListening ? 'border-red-500 ring-2 ring-red-50' : 'border-gray-300 focus-within:border-rani-500 focus-within:ring-2 focus-within:ring-rani-100')}`}>
                        <select className="bg-gray-50 text-[11px] font-bold uppercase px-4 border-r border-gray-200 text-gray-600 outline-none cursor-pointer tracking-wide" value={searchCategory} onChange={(e) => setSearchCategory(e.target.value)}>
                            <option value="All">All</option>
                            <option value="Western">Western</option>
                            <option value="Ethnic">Ethnic</option>
                            <option value="Indo-Western">Fusion</option>
                        </select>
                        <input type="text" placeholder={isSemanticSearching ? "AI is refining..." : (isAnalyzingImage ? "Analyzing Image..." : (isListening ? "Listening..." : t('nav.searchPlaceholder')))} className="flex-1 px-4 py-2 bg-transparent outline-none text-luxury-black placeholder-gray-400 w-full min-w-0 font-medium text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={isAnalyzingImage || isSemanticSearching} />
                        <div className="flex border-l border-gray-100 items-center pr-2">
                            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center text-gray-400 hover:text-rani-600" disabled={isAnalyzingImage} title="Image Search">{isAnalyzingImage ? "..." : "📷"}</button>
                            <button type="button" onClick={handleVoiceSearch} className={`p-2 hover:bg-gray-50 rounded-full transition-colors flex items-center justify-center ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-rani-600'}`} title="Voice Search">🎤</button>
                        </div>
                        <button type="submit" className="bg-rani-600 px-6 hover:bg-rani-700 text-white transition-colors shrink-0 flex items-center justify-center font-heading">
                            {isSemanticSearching ? "⌛" : "Search"}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="hidden md:flex flex-1 justify-center gap-4">
                     <div className="text-sm text-gray-400 italic font-medium">B2B Wholesale Portal</div>
                </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-4 md:gap-6 shrink-0">
                {/* Mobile Search Trigger */}
                {user && (
                    <button onClick={() => navigate('/shop')} className="md:hidden text-luxury-black">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                )}

                {user && <NotificationCenter />}

                {/* Cart */}
                <Link to="/cart" className="relative group text-luxury-black hover:text-rani-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rani-500 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gold-600 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                            {cart.length}
                        </span>
                    )}
                </Link>

                {/* Sign In Button (Header) */}
                {!user && (
                    <Link to="/login" className="bg-luxury-black text-white px-5 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-rani-600 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-rani-500">
                        Sign In
                    </Link>
                )}
            </div>
        </div>
      </div>
    </header>
      
      {/* Sidebar - Inline Definition to prevent remounting issues */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      >
          <aside 
            ref={sidebarRef}
            className={`fixed top-0 left-0 h-[100dvh] w-full md:w-[350px] bg-white shadow-2xl transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} overflow-y-auto flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Main Navigation"
          >
              {/* Sidebar Header */}
              <div className="p-6 bg-gradient-to-br from-rani-50 to-white border-b border-rani-100 flex items-start justify-between shrink-0">
                  <div className="flex items-center gap-4">
                      {user ? (
                          <>
                              <div className="w-12 h-12 bg-rani-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg ring-2 ring-white">
                                  {user.fullName.charAt(0)}
                              </div>
                              <div>
                                  <p className="font-bold text-gray-900 leading-tight text-sm">{user.fullName}</p>
                                  <p className="text-xs text-rani-600 font-medium">{user.businessName}</p>
                                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide font-bold">{user.role}</p>
                              </div>
                          </>
                      ) : (
                          <>
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-2 border-gray-50">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              </div>
                              <div>
                                  <p className="font-bold text-gray-800 text-sm">Guest User</p>
                                  <Link to="/login" className="text-xs text-rani-600 font-bold hover:underline" onClick={() => setIsMenuOpen(false)}>Login for B2B Prices</Link>
                              </div>
                          </>
                      )}
                  </div>
                  <button 
                    ref={closeButtonRef}
                    onClick={() => setIsMenuOpen(false)} 
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rani-500"
                    aria-label="Close Menu"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto p-4 space-y-8">
                  
                  {/* Section: Market */}
                  <div>
                      <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Marketplace</p>
                      <ul className="space-y-1">
                          <SidebarItem to="/" label="Home" icon={NavIcons.Home} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/shop" label="Shop Collection" icon={NavIcons.Shop} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/pre-book" label="Pre-Book Club" icon={NavIcons.PreBook} badge="Exclusive" className="bg-gold-50 text-gold-800 hover:bg-gold-100 hover:text-gold-900 border border-gold-200" onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/quick-order" label="Quick Order" icon={NavIcons.QuickOrder} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/collections" label="Visual Scout (AI)" icon={NavIcons.VisualScout} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/saloni-tv" label="Saloni TV" icon={NavIcons.TV} onClick={() => setIsMenuOpen(false)} />
                      </ul>
                  </div>

                  {/* Section: Account */}
                  <div>
                      <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">My Business</p>
                      <ul className="space-y-1">
                          <SidebarItem to="/orders" label="Order History" icon={NavIcons.Orders} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/ledger" label="Financial Ledger" icon={NavIcons.Ledger} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/wishlist" label="Wishlist" icon={NavIcons.Wishlist} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/marketing-kit" label="Reseller Kit" icon={NavIcons.Marketing} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/design-studio" label="Design Studio" icon={NavIcons.Design} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/smart-stocker" label="AI Smart Stocker" icon={NavIcons.Stocker} onClick={() => setIsMenuOpen(false)} />
                      </ul>
                  </div>

                  {/* Section: Support */}
                  <div>
                      <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Support</p>
                      <ul className="space-y-1">
                          <SidebarItem to="/book-visit" label="Book Visit" icon={NavIcons.Visit} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/support" label="Helpdesk" icon={NavIcons.Support} onClick={() => setIsMenuOpen(false)} />
                          <SidebarItem to="/distributors" label="Partner Finder" icon={NavIcons.Partners} onClick={() => setIsMenuOpen(false)} />
                      </ul>
                  </div>

                  {/* Section: Settings & Tools */}
                  <div className="border-t border-gray-100 pt-4">
                      <ul className="space-y-1">
                          <SidebarItem to="/profile" label="Settings" icon={NavIcons.Settings} onClick={() => setIsMenuOpen(false)} />
                          
                          <li onClick={() => { setLanguage(language === 'en' ? 'hi' : 'en'); setIsMenuOpen(false); }} className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">
                              <span className="text-gray-400">🌐</span>
                              <span className="flex-1">Language</span>
                              <span className="text-xs font-bold bg-gray-200 px-2 py-1 rounded text-gray-600">{language === 'en' ? 'English' : 'हिंदी'}</span>
                          </li>

                          <li onClick={() => { setTutorialOpen(true); setIsMenuOpen(false); }} className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl cursor-pointer">
                              <span className="text-gray-400">🎓</span>
                              <span>Play Tutorial</span>
                          </li>

                          {user && (
                              <li onClick={() => { logout(); setIsMenuOpen(false); }} className="flex items-center gap-4 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer mt-4">
                                  <span>🚪</span>
                                  <span className="font-bold">Sign Out</span>
                              </li>
                          )}
                      </ul>
                  </div>
              </nav>
          </aside>
      </div>
    </>
  );
};
