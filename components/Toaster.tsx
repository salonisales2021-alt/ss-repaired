
import React, { useState, useEffect, createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`
              pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border animate-fade-in-up
              ${t.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
              ${t.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
              ${t.type === 'info' ? 'bg-luxury-black text-white border-gray-800' : ''}
              ${t.type === 'warning' ? 'bg-orange-50 border-orange-200 text-orange-800' : ''}
            `}
          >
            <span className="text-lg">
              {t.type === 'success' && '✅'}
              {t.type === 'error' && '🚫'}
              {t.type === 'info' && '✨'}
              {t.type === 'warning' && '⚠️'}
            </span>
            <p className="text-sm font-bold tracking-tight">{t.message}</p>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="ml-4 opacity-50 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
