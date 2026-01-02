
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ProductCategory, Product } from '../../types';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toaster';

export const PreBook: React.FC = () => {
    const { user, products, addToCart, triggerSecurityLockout } = useApp();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [exclusiveProducts, setExclusiveProducts] = useState<Product[]>([]);

    useEffect(() => {
        // 1. Permission Check
        if (!user || !user.isPreBookApproved) {
            navigate('/');
            return;
        }

        // 2. Load Products
        const items = products.filter(p => p.category === ProductCategory.PRE_BOOK);
        setExclusiveProducts(items);

        // 3. SECURITY: Screenshot Detection Logic
        const handleKeyDown = (e: KeyboardEvent) => {
            // PrintScreen, Cmd+Shift+3/4 (Mac attempts - hard to catch perfectly in web but worth a try)
            if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
                e.preventDefault();
                handleSecurityBreach("Screenshot Key Detected");
            }
            // Prevent Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSecurityBreach("Save Page Attempt");
            }
        };

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            return false;
        };

        // Window Blur detection (often happens when snipping tools are activated)
        const handleBlur = () => {
            // We won't ban for blur as it's too aggressive (switching tabs), 
            // but we can cover the content
            document.body.classList.add('blur-content');
        };

        const handleFocus = () => {
            document.body.classList.remove('blur-content');
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('contextmenu', handleContextMenu);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        // Additional CSS protection
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('contextmenu', handleContextMenu);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.body.style.userSelect = 'auto';
            document.body.style.webkitUserSelect = 'auto';
            document.body.classList.remove('blur-content');
        };
    }, [user, products, navigate]);

    const handleSecurityBreach = (reason: string) => {
        // Visual warning first
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'red';
        overlay.style.zIndex = '99999';
        overlay.innerHTML = '<div style="color:white; font-size: 24px; text-align:center; padding-top: 20%;">SECURITY VIOLATION DETECTED.<br/>ACCOUNT LOCKING...</div>';
        document.body.appendChild(overlay);

        // Trigger logic
        triggerSecurityLockout(reason);
    };

    if (!user?.isPreBookApproved) return null;

    return (
        <div className="min-h-screen bg-gray-900 text-gold-100 selection:bg-red-900 font-sans pb-20 relative">
            <style>{`
                .blur-content #exclusive-content {
                    filter: blur(20px);
                    opacity: 0.2;
                }
            `}</style>

            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 border-b border-gold-600/30 sticky top-16 z-20">
                <div className="container mx-auto px-6 py-8 text-center">
                    <div className="inline-block border border-gold-500/50 px-4 py-1 rounded-full text-[10px] uppercase tracking-[0.3em] text-gold-400 mb-4 animate-pulse">
                        Confidential Access
                    </div>
                    <h1 className="text-4xl md:text-6xl font-script text-white mb-4">The Pre-Book Club</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm leading-relaxed">
                        Exclusive runway designs for elite partners. Orders placed here are dispatched in 
                        <span className="text-gold-400 font-bold"> 30-60 days</span>. 
                        Screenshots are strictly prohibited and will result in immediate account termination.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div id="exclusive-content" className="container mx-auto px-4 mt-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {exclusiveProducts.map(product => (
                        <div key={product.id} className="group relative bg-black border border-gray-800 hover:border-gold-600/50 transition-all duration-500 rounded-xl overflow-hidden">
                            <div className="aspect-[3/4] relative overflow-hidden">
                                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
                                <img 
                                    src={product.images[0]} 
                                    alt="Restricted" 
                                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
                                />
                                <div className="absolute top-4 right-4 bg-red-900/90 text-white text-[10px] font-black px-3 py-1 rounded uppercase tracking-widest backdrop-blur-sm border border-red-500/30">
                                    Pre-Order Only
                                </div>
                                {/* Watermark Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <div className="rotate-45 text-white text-xs font-black uppercase tracking-[1em] whitespace-nowrap">
                                        {user.businessName} • Confidential
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-1 font-heading">{product.name}</h3>
                                        <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">{product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-gold-400">₹{product.basePrice.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">Per Piece</p>
                                    </div>
                                </div>
                                
                                <p className="text-gray-400 text-xs leading-relaxed mb-6 border-l-2 border-gold-600/30 pl-3 italic">
                                    {product.description}
                                </p>

                                <Button 
                                    fullWidth 
                                    className="bg-gold-600 hover:bg-gold-700 text-black border-none font-bold tracking-widest uppercase h-12"
                                    onClick={() => {
                                        addToCart(product, product.variants[0], 1);
                                        toast("Added to Cart (Pre-Book Terms Apply)", "success");
                                    }}
                                >
                                    Secure Slot (60 Days)
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {exclusiveProducts.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl">
                        <p className="text-gray-500 uppercase tracking-widest text-xs">No Exclusive Items Available</p>
                    </div>
                )}
            </div>
        </div>
    );
};
