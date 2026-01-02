
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white text-center px-4">
      <h1 className="text-9xl font-bold text-gray-100 select-none">404</h1>
      <div className="-mt-12 relative z-10">
        <h2 className="text-3xl font-heading font-bold text-luxury-black mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">The page you are looking for might have been removed or is temporarily unavailable.</p>
        <div className="flex justify-center gap-4">
            <Button onClick={() => navigate('/')}>Back to Home</Button>
            <Button variant="outline" onClick={() => navigate('/shop')}>Browse Shop</Button>
        </div>
      </div>
    </div>
  );
};
