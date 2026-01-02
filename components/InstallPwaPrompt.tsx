
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { BrandLogo } from './BrandLogo';

export const InstallPwaPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Check Session Storage (Don't bug user if they closed it)
    const isDismissed = sessionStorage.getItem('saloni_install_dismissed');
    if (isDismissed) return;

    // 2. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIosDevice && !isStandalone) {
        setIsIOS(true);
        // Show after a slight delay for better UX
        setTimeout(() => setShowPrompt(true), 3000);
    }

    // 3. Android/Chrome Standard Event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
      setShowPrompt(false);
      sessionStorage.setItem('saloni_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden relative border border-gray-100">
            <button 
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 bg-rani-50 p-4 rounded-full">
                    <BrandLogo className="h-12" />
                </div>
                
                <h3 className="text-xl font-heading font-bold text-gray-900 mb-2">Install App</h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Get the full B2B experience. Faster access, offline mode, and exclusive notifications.
                </p>

                {isIOS ? (
                    <div className="bg-gray-50 p-4 rounded-xl text-sm text-left w-full mb-6 border border-gray-200">
                        <p className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <span className="text-xl">📲</span> To Install on iOS:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
                            <li>Tap the <span className="font-bold text-blue-600">Share</span> button below.</li>
                            <li>Scroll down and tap <span className="font-bold">"Add to Home Screen"</span>.</li>
                        </ol>
                    </div>
                ) : (
                    <Button fullWidth onClick={handleInstallClick} className="h-12 shadow-lg shadow-rani-500/30 mb-3">
                        Install Now
                    </Button>
                )}

                <button 
                    onClick={handleDismiss} 
                    className="text-xs text-gray-400 font-bold hover:text-gray-600 uppercase tracking-widest mt-2"
                >
                    Maybe Later
                </button>
            </div>
        </div>
    </div>
  );
};
