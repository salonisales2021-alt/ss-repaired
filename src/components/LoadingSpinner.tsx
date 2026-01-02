
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-gray-50">
      <div className="relative">
        {/* Spinning Ring */}
        <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-rani-600 rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
        
        {/* Brand Icon in Center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-serif text-rani-600 font-bold">
          S
        </div>
      </div>
      <p className="mt-6 text-xs font-bold text-rani-600 uppercase tracking-[0.2em] animate-pulse">Loading Saloni Sales...</p>
    </div>
  );
};
