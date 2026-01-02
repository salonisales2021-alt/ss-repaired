

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types';

export const VideoFeed: React.FC = () => {
    const { products, addToCart, calculatePrice } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    // Filter products that actually have videos
    const videoProducts = products.filter(p => p.video);
    
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Quick Add Sheet
    const [activeProduct, setActiveProduct] = useState<Product | null>(null);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [qty, setQty] = useState(12);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'));
                        setCurrentIndex(index);
                        
                        // Auto-play the visible video
                        const video = entry.target.querySelector('video');
                        if (video) {
                            video.currentTime = 0;
                            video.play().catch(() => {});
                        }
                    } else {
                        // Pause non-visible
                        const video = entry.target.querySelector('video');
                        if (video) video.pause();
                    }
                });
            },
            { threshold: 0.6 } // 60% visibility trigger
        );

        const items = document.querySelectorAll('.video-item');
        items.forEach(item => observer.observe(item));

        return () => observer.disconnect();
    }, [videoProducts]);

    const handleAddToCart = () => {
        if (!activeProduct || !selectedVariant) return;
        const variant = activeProduct.variants.find(v => v.id === selectedVariant);
        if (variant) {
            addToCart(activeProduct, variant, qty);
            setActiveProduct(null); // Close sheet
            alert(`Added ${qty} pcs to cart!`);
        }
    };

    const toggleMute = () => setIsMuted(!isMuted);

    if (videoProducts.length === 0) {
        return (
            <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-black text-white p-8 text-center">
                <div className="text-4xl mb-4">🎬</div>
                <h2 className="text-2xl font-bold mb-2">No Videos Yet</h2>
                <p className="text-gray-400">Our runway feed is being updated. Check back soon!</p>
                <Button onClick={() => navigate('/shop')} className="mt-6" variant="outline">Browse Shop</Button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-64px)] bg-black overflow-hidden relative">
            <div 
                ref={containerRef}
                className="h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
            >
                {videoProducts.map((product, idx) => {
                    // Fix: calculatePrice updated with piecesPerSet and qtySets
                    const price = calculatePrice(product.basePrice, 1, 12).finalPrice;
                    const stock = product.variants.reduce((acc, v) => acc + v.stock, 0);

                    return (
                        <div 
                            key={product.id} 
                            data-index={idx}
                            className="video-item h-full w-full relative snap-center flex justify-center bg-black"
                        >
                            {/* Video Player */}
                            <video
                                src={product.video}
                                className="h-full w-full object-cover md:max-w-md"
                                loop
                                muted={isMuted}
                                playsInline
                                onClick={toggleMute}
                            />

                            {/* Mute Indicator */}
                            {isMuted && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 p-4 rounded-full pointer-events-none animate-ping-once">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeDasharray="2 2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                                </div>
                            )}

                            {/* Overlay Info */}
                            <div className="absolute inset-x-0 bottom-0 pt-20 pb-8 px-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end md:max-w-md mx-auto pointer-events-none">
                                <div className="pointer-events-auto">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h2 className="text-white font-bold text-xl drop-shadow-md leading-tight">{product.name}</h2>
                                            <p className="text-gray-300 text-xs font-mono mt-1">SKU: {product.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-rani-400 font-bold text-2xl drop-shadow-md">₹{price}</span>
                                            <span className="text-[10px] text-gray-400">min 12 pcs</span>
                                        </div>
                                    </div>

                                    <p className="text-gray-200 text-sm line-clamp-2 mb-4 drop-shadow-sm opacity-90">
                                        {product.description}
                                    </p>

                                    <div className="flex gap-3">
                                        <Button 
                                            fullWidth 
                                            className="bg-white text-black hover:bg-gray-200 border-none font-bold"
                                            onClick={() => { setActiveProduct(product); setSelectedVariant(product.variants[0]?.id); }}
                                        >
                                            {t('videoFeed.addToCart')}
                                        </Button>
                                        <Button 
                                            className="w-12 px-0 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md border-white/20"
                                            onClick={() => navigate(`/product/${product.id}`)}
                                        >
                                            ℹ️
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Side Actions (Like, Share) */}
                            <div className="absolute right-4 bottom-32 flex flex-col gap-4 items-center md:right-[calc(50%-224px+16px)]">
                                <button className="flex flex-col items-center gap-1 group">
                                    <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-rani-500/80 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                    </div>
                                    <span className="text-white text-[10px] font-bold shadow-black drop-shadow-md">Love</span>
                                </button>
                                <button 
                                    className="flex flex-col items-center gap-1 group"
                                    onClick={() => {
                                        const url = `${window.location.origin}/#/product/${product.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Link copied!");
                                    }}
                                >
                                    <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 group-hover:bg-green-500/80 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                                    </div>
                                    <span className="text-white text-[10px] font-bold shadow-black drop-shadow-md">Share</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Add Sheet (Mobile Style) */}
            {activeProduct && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-end justify-center animate-fade-in" onClick={() => setActiveProduct(null)}>
                    <div className="bg-white w-full md:max-w-md rounded-t-xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-800">Quick Add: {activeProduct.name}</h3>
                            <button onClick={() => setActiveProduct(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">✕</button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Variant</label>
                                <div className="flex flex-wrap gap-2">
                                    {activeProduct.variants.map(v => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v.id)}
                                            // Fix: v.size -> v.sizeRange
                                            className={`px-3 py-2 border rounded text-sm ${selectedVariant === v.id ? 'bg-rani-500 text-white border-rani-500' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                                        >
                                            {v.color} - {v.sizeRange}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity (Sets)</label>
                                <select 
                                    className="w-full border p-2 rounded"
                                    value={qty}
                                    onChange={(e) => setQty(Number(e.target.value))}
                                >
                                    {[12, 24, 36, 48, 60, 100].map(n => <option key={n} value={n}>{n} Sets</option>)}
                                </select>
                            </div>

                            {/* Fix: calculatePrice call updated */}
                            <Button fullWidth onClick={handleAddToCart} size="lg">
                                Add to Order - ₹{calculatePrice(activeProduct.basePrice, 1, qty).finalPrice * qty}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
