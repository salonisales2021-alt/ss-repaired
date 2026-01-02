
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';

export const AppSecurity: React.FC = () => {
  const { user } = useApp();
  const [isBlurred, setIsBlurred] = useState(false);

  // Global Security Event Listeners
  useEffect(() => {
    // Disable Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right click on inputs for copy/paste
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return true;
      }
      e.preventDefault();
      return false;
    };

    // Disable Keyboard Shortcuts commonly used for saving/printing/inspecting
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Print (Ctrl+P or Cmd+P)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        alert("Printing is disabled for security reasons.");
      }
      
      // Prevent Save (Ctrl+S or Cmd+S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopPropagation();
      }

      // Prevent Developer Tools (F12, Ctrl+Shift+I, Ctrl+Shift+C, Ctrl+Shift+J, Ctrl+U)
      if (
        e.key === 'F12' || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Detect PrintScreen Key
      if (e.key === 'PrintScreen') {
         setIsBlurred(true);
         setTimeout(() => setIsBlurred(false), 2000); // Keep blurred for 2s
         
         // Try to clear clipboard (works in some secure contexts)
         try { navigator.clipboard.writeText(''); } catch (err) {}
      }
    };

    // Add Listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Apply blur effect to the root element when security triggers (PrintScreen)
  useEffect(() => {
      const root = document.getElementById('root');
      if (root) {
          if (isBlurred) {
              root.style.filter = 'blur(20px) grayscale(100%)';
              root.style.pointerEvents = 'none'; // Prevent interaction while blurred
              root.style.transition = 'filter 0.1s ease-out';
          } else {
              root.style.filter = 'none';
              root.style.pointerEvents = 'auto';
              root.style.transition = 'filter 0.2s ease-in';
          }
      }
  }, [isBlurred]);

  // Watermark Logic - Only visible for authenticated users to trace leaks
  if (!user) return null;

  // Construct a traceability string: Business Name + Mobile/Email
  const watermarkText = `${user.businessName || user.fullName} • ${user.mobile || user.email}`;

  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden flex items-center justify-center select-none" 
      style={{ zIndex: 2147483647, mixBlendMode: 'multiply' }}
      aria-hidden="true"
    >
        {/* Tiled Watermark Pattern */}
        <div className="w-[200%] h-[200%] flex flex-wrap content-start items-center justify-center opacity-[0.05] -rotate-12 transform -translate-x-1/4 -translate-y-1/4">
            {Array.from({ length: 400 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-64 h-32 flex items-center justify-center text-sm font-black text-gray-900 whitespace-nowrap uppercase tracking-widest p-4"
                >
                    {watermarkText}
                </div>
            ))}
        </div>
    </div>
  );
};
