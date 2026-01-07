
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { NotificationCenter } from '../../components/NotificationCenter';
import { GoogleGenAI } from "@google/genai";
import { BrandLogo } from '../../components/BrandLogo';

// Helper component defined outside to avoid recreation
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

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Accessibility: Handle Escape key and Body Scroll Lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      // Move focus to close button for a11y
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

    // Check if it's a direct SKU search (simple heuristic: has numbers, short, no spaces or hyphens)
    const isSkuLike = /^[A-Z0-9-]{3,10}$/i.test(searchTerm.trim()) && /\d/.test(searchTerm);

    if (!isSkuLike) {
        setIsSemanticSearching(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
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
            
            // Navigate with the expanded terms
            const params = new URLSearchParams();
            params.append('search', refined);
            if (searchCategory && searchCategory !== 'All') params.append('cat', searchCategory);
            navigate(`/shop?${params.toString()}`);

        } catch (err) {
            // Fallback to basic search on error
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
        // Auto-submit voice search
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
              const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
              const response = await ai.models.generateContent({
                  model: 'gemini-2.5-flash',
                  contents: [
                      { inlineData: { mimeType: file.type, data: base64data } },
                      { text: "Describe the fashion item in this image in 3-4 simple keywords for search (e.g. 'Red Velvet Lehenga', 'Blue Cotton Frock'). Return ONLY the keywords." }
                  ]
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
                    aria-expanded={isMenuOpen}
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
                          <SidebarItem to="/" label="Home" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>} />
                          <SidebarItem to="/shop" label="Shop Collection" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>} />
                          {user?.isPreBookApproved && (
                              <SidebarItem 
                                  to="/pre-book" 
                                  label="Pre-Book Club" 
                                  className="bg-gray-900 text-gold-400 hover:bg-black hover:text-gold-300 border border-gold-600/30"
                                  icon={<span className="text-xl">💎</span>}
                                  badge="EXCLUSIVE"
                              />
                          )}
                          <SidebarItem to="/collections" label="Lookbooks & Scout" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                      </ul>
                  </div>

                  {/* Section: Business (Only if logged in) */}
                  {user && (
                      <div>
                          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">My Business</p>
                          <ul className="space-y-1">
                              <SidebarItem to="/cart" label="Cart" badge={cart.length > 0 ? cart.length : ''} icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                              <SidebarItem to="/orders" label="Orders & Returns" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} />
                              <SidebarItem to="/ledger" label="Financial Ledger" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                              <SidebarItem to="/wishlist" label="Wishlist" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} />
                              {user.role !== 'RETAILER' && (
                                  <SidebarItem to="/agent/dashboard" label="Partner Dashboard" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                              )}
                          </ul>
                      </div>
                  )}

                  {/* Section: Intelligence */}
                  {user && (
                      <div>
                          <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">AI Tools</p>
                          <ul className="space-y-1">
                              <SidebarItem to="/smart-stocker" label="Smart Stocker" icon={<span className="text-lg">🧠</span>} />
                              <SidebarItem to="/design-studio" label="Custom Studio" icon={<span className="text-lg">✨</span>} />
                              <SidebarItem to="/saloni-tv" label="Saloni TV" icon={<span className="text-lg">📺</span>} />
                          </ul>
                      </div>
                  )}

                  {/* Section: Utility */}
                  <div>
                      <p className="px-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Support & Settings</p>
                      <ul className="space-y-1">
                          <SidebarItem to="/distributors" label="Locate Distributors" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                          <SidebarItem to="/support" label="Helpdesk" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
                          <li>
                              <button 
                                onClick={() => setTutorialOpen(true)}
                                className="flex w-full items-center gap-4 px-4 py-3 text-gray-700 hover:bg-rani-50 hover:text-rani-700 rounded-xl transition-all duration-200 group text-left font-medium"
                              >
                                  <span className="text-gray-400 group-hover:text-rani-500 transition-colors">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </span>
                                  <span className="flex-1">App Tutorial</span>
                              </button>
                          </li>
                      </ul>
                  </div>
              </nav>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0 space-y-3">
                  <button onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:border-rani-300 transition-colors shadow-sm">
                      <span className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                          Language
                      </span>
                      <span className="text-rani-600 bg-rani-50 px-2 py-0.5 rounded text-xs">{language === 'en' ? 'English' : 'हिंदी'}</span>
                  </button>
                  
                  {user ? (
                      <button onClick={logout} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm border border-transparent hover:border-red-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          Sign Out
                      </button>
                  ) : (
                      <Link to="/login" className="flex items-center justify-center w-full px-4 py-4 bg-luxury-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors uppercase tracking-wide shadow-lg">
                          Sign In Now
                      </Link>
                  )}
              </div>
          </aside>
      </div>
    </header>
    </>
  );
};
