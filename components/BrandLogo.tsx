
import React from 'react';

interface BrandLogoProps {
  className?: string;
}

/**
 * Saloni Girls Fashion - Official Brand Logo
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = "h-14" }) => {
  return (
    <img 
      src="https://tikuoenvshrrweahpvpb.supabase.co/storage/v1/object/public/saloniAssets/websiteAssets/logo(2).png" 
      alt="Saloni Girls Fashion" 
      className={`${className} w-auto object-contain block`}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        console.warn("Logo load failed for path: " + target.src);
      }}
    />
  );
};
