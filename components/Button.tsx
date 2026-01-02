
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-heading font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed tracking-wide";
  
  const variants = {
    // Primary: Royal Burgundy with subtle depth, no aggressive neon
    primary: "bg-rani-500 text-white hover:bg-rani-700 shadow-md active:bg-rani-900 border border-transparent",
    // Secondary: Rich Gold/Ochre tones for secondary actions (implies wealth/trust)
    secondary: "bg-gold-600 text-white hover:bg-gold-700 shadow-md border border-gold-600",
    // Outline: Gold/Bronze border for elegance
    outline: "border border-gold-600 text-gold-700 hover:bg-gold-50 bg-transparent",
    // Text link
    text: "text-luxury-black hover:text-rani-600 underline-offset-4 hover:underline"
  };

  const sizes = {
    sm: "text-xs px-4 py-1.5 rounded",
    md: "text-sm px-6 py-2.5 rounded-md",
    lg: "text-base px-8 py-3.5 rounded-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
