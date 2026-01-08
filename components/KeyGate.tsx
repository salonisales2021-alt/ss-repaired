
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { getGeminiKey } from '../services/db';
import { useNavigate } from 'react-router-dom';

interface KeyGateProps {
  children: React.ReactNode;
  featureName: string;
  onKeySelected?: () => void;
}

/**
 * KeyGate ensures that premium AI features are only accessible after 
 * the user has a valid API key (Env var, LocalStorage, or AI Studio selection).
 */
export const KeyGate: React.FC<KeyGateProps> = ({ children, featureName, onKeySelected }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);
  const navigate = useNavigate();

  const checkKey = async () => {
    // 1. Check if we have a key in storage or env (The seamless path)
    const storedKey = getGeminiKey();
    if (storedKey && storedKey.length > 10) {
        setHasKey(true);
        setChecking(false);
        return;
    }

    // 2. Fallback: Check AI Studio Bridge (Project IDX)
    const aistudio = (window as any).aistudio;
    if (aistudio?.hasSelectedApiKey) {
      const selected = await aistudio.hasSelectedApiKey();
      if (selected) {
          setHasKey(true);
      }
    }
    setChecking(false);
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
      await aistudio.openSelectKey();
      setHasKey(true);
      if (onKeySelected) onKeySelected();
    } else {
        // Redirect to settings if AI Studio bridge isn't available
        if (confirm("No direct Google Cloud link detected. Go to Settings to paste your API Key manually?")) {
            navigate('/admin/settings');
        }
    }
  };

  if (checking) return <div className="p-4 text-center text-xs text-gray-400 animate-pulse">Verifying AI Access...</div>;

  if (!hasKey) {
    return (
      <div className="bg-luxury-black/5 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl">🔑</div>
        <div>
          <h3 className="font-bold text-gray-800">{featureName} Requires Access</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">
            This premium AI feature requires a valid Gemini API key.
          </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleSelectKey} size="sm" className="px-6">Connect Key</Button>
            <Button onClick={() => navigate('/admin/settings')} variant="outline" size="sm">Open Settings</Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
