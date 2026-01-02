
import React, { useState, useEffect } from 'react';
import { Button } from './Button';

interface KeyGateProps {
  children: React.ReactNode;
  featureName: string;
  onKeySelected?: () => void;
}

/**
 * KeyGate ensures that premium AI features are only accessible after 
 * the user has selected a valid API key via the AI Studio dialog.
 */
export const KeyGate: React.FC<KeyGateProps> = ({ children, featureName, onKeySelected }) => {
  const [hasKey, setHasKey] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    }
    setChecking(false);
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      // Assume success as per instructions to avoid race conditions
      setHasKey(true);
      if (onKeySelected) onKeySelected();
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
            This premium AI feature requires a valid API key from a paid GCP project. 
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-rani-600 underline ml-1">Learn about billing</a>.
          </p>
        </div>
        <Button onClick={handleSelectKey} size="sm" className="px-8">Select API Key</Button>
      </div>
    );
  }

  return <>{children}</>;
};
