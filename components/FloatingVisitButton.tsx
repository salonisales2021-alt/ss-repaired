import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const FloatingVisitButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on the booking page itself or admin pages
  if (location.pathname === '/book-visit' || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <button
      onClick={() => navigate('/book-visit')}
      className="fixed bottom-6 right-6 z-40 bg-luxury-black text-white px-6 py-4 rounded-full shadow-2xl hover:bg-rani-600 hover:scale-105 transition-all duration-300 flex items-center gap-3 border border-gray-700 hover:border-rani-500 group"
      aria-label="Book a Visit"
    >
      <div className="relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rani-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rani-500"></span>
        </span>
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Book Appointment</span>
        <span className="font-bold text-sm">Schedule Visit</span>
      </div>
    </button>
  );
};
