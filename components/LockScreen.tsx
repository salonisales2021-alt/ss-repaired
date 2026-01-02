
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

export const LockScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center p-8 bg-gray-50 relative overflow-hidden rounded-lg border border-gray-100">
      {/* Decorative background elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-1/4 w-96 h-96 bg-rani-100/30 rounded-full blur-3xl -translate-y-1/2"></div>
         <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gray-200/50 rounded-full blur-3xl translate-y-1/2"></div>
      </div>

      <div className="relative z-10 max-w-lg w-full bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-xl shadow-lg border border-white">
        <div className="w-20 h-20 bg-luxury-black text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-rani-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-script text-luxury-black mb-3">Members Only</h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Access to our exclusive wholesale collection and pricing is reserved for registered B2B partners.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
          <Button onClick={() => navigate('/login')} size="lg" className="w-full sm:w-auto shadow-rani-500/20 shadow-lg">
            Login to Account
          </Button>
          <Button onClick={() => navigate('/register')} variant="outline" size="lg" className="w-full sm:w-auto bg-white/50 hover:bg-white">
            Register Business
          </Button>
        </div>
        
        <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest">
          Saloni Sales B2B Portal
        </p>
      </div>
    </div>
  );
};
