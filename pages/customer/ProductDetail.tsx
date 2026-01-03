
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Button } from '../../components/Button';
import { ProductVariant, Review } from '../../types';

const getColorValue = (colorName: string) => {
    const map: Record<string, string> = {
        'Red': '#EF4444', 'Blue': '#3B82F6', 'Green': '#10B981', 'Yellow': '#F59E0B',
        'Black': '#111827', 'White': '#FFFFFF', 'Pink': '#EC4899', 'Rani': '#BE123C',
        'Navy': '#1E3A8A', 'Teal': '#14B8A6', 'Grey': '#6B7280', 'Orange': '#F97316',
        'Purple': '#8B5CF6', 'Maroon': '#800000', 'Gold': '#D97706', 'Silver': '#C0C0C0'
    };
    return map[colorName] || colorName.toLowerCase();
};

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, products, calculatePrice, user } = useApp();
  
  const product = products.find(p => p.id === id);
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);
  }, [product, products]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [qtySets, setQtySets] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // Review Form State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Zoom & Lightbox State
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const isDragging = useRef(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Swipe state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const uniqueColors = useMemo(() => {
      if (!product) return [];
      return Array.from(new Set(product.variants.map(v => v.color))).sort();
  }, [product]);

  const uniqueRanges = useMemo(() => {
      if (!product) return [];
      return Array.from(new Set(product.variants.map(v => v.sizeRange)));
  }, [product]);

  const mediaItems = useMemo(() => {
      if (!product) return [];
      const items: { type: 'image' | 'video', url: string }[] = product.images.map(url => ({ type: 'image' as const, url }));
      if (product.video) items.push({ type: 'video' as const, url: product.video });
      return items;
  }, [product]);

  const currentVariant = useMemo(() => {
      if (!product || !selectedColor || !selectedRange) return null;
      return product.variants.find(v => v.color === selectedColor && v.sizeRange === selectedRange) || null;
  }, [product, selectedColor, selectedRange]);

  const pricing = useMemo(() => {
      const base = currentVariant ? currentVariant.pricePerPiece : (product?.basePrice || 0);
      const pieces = currentVariant ? currentVariant.piecesPerSet : 6;
      const setPrice = base * pieces;
      return {
          perPiece: base,
          perSet: setPrice,
          total: setPrice * qtySets
      };
  }, [currentVariant, product, qtySets]);

  const isEligibleForCredit = useMemo(() => {
      if (!user) return false;
      const limit = user.creditLimit || 0;
      const dues = user.outstandingDues || 0;
      return (dues + pricing.total) <= limit;
  }, [user, pricing.total]);

  useEffect(() => {
    if (product) {
       const firstInStock = product.variants.find(v => v.stock > 0) || product.variants[0];
       if (firstInStock) {
           setSelectedColor(firstInStock.color);
           setSelectedRange(firstInStock.sizeRange);
       }
       setCurrentImageIndex(0);
       setQtySets(1);
       loadReviews(product.id);
    }
  }, [product, id]);

  const loadReviews = async (pId: string) => {
      const data = await db.getReviews(pId);
      setReviews(data);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !product) return;
      setSubmittingReview(true);
      
      const success = await db.addReview({
          productId: product.id,
          userId: user.id,
          userName: user.businessName || user.fullName,
          rating: userRating,
          comment: userComment
      });
      
      if (success) {
          setUserComment('');
          setUserRating(5);
          await loadReviews(product.id);
      } else {
          alert('Failed to submit review.');
      }
      setSubmittingReview(false);
  };

  // Auto-scroll thumbnails when image changes
  useEffect(() => {
    if (thumbnailRef.current) {
      const activeThumb = thumbnailRef.current.children[currentImageIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentImageIndex]);

  if (!product) return <div className="p-8 text-center">Product not found. <Button onClick={() => navigate('/shop')}>Back to Shop</Button></div>;

  const handleAddToCart = () => {
    if (currentVariant) {
        addToCart(product, currentVariant, qtySets);
        alert(`Successfully added ${qtySets} Sets (${qtySets * currentVariant.piecesPerSet} pieces) to your order.`);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
      setTouchStart(e.targetTouches[0].clientX);
      isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
      isDragging.current = true;
  };

  const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) {
          nextImage();
      }
      if (isRightSwipe) {
          prevImage();
      }
      
      // Reset
      setTouchStart(0);
      setTouchEnd(0);
      // Keep isDragging true briefly to prevent click trigger immediately after swipe
      setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  const handleMainImageClick = () => {
      if (!isDragging.current) {
          setIsLightboxOpen(true);
      }
  };

  const renderStars = (rating: number) => {
      return Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
      ));
  };

  const currentMedia = mediaItems[currentImageIndex];

  return (
    <div className="bg-white min-h-screen pb-12 font-sans">
      <div className="bg-gray-50 py-3 border-b border-gray-100">
          <div className="container mx-auto px-4 text-xs text-gray-500 flex items-center gap-2 flex-wrap">
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/')}>Home</span>
              <span className="text-gray-300">&gt;</span>
              <span className="cursor-pointer hover:underline" onClick={() => navigate('/shop')}>Shop</span>
              <span className="text-gray-300">&gt;</span>
              <span className="cursor-pointer hover:underline" onClick={() => navigate(`/shop?cat=${encodeURIComponent(product.category)}`)}>{product.category}</span>
              <span className="text-gray-300">&gt;</span>
              <span className="font-bold text-gray-700 truncate">{product.name}</span>
          </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-12">
            <div className="w-full lg:w-1/2">
                <div 
                    className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden group border border-gray-200 shadow-sm touch-pan-y select-none cursor-zoom-in"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseMove={currentMedia?.type !== 'video' ? handleMouseMove : undefined}
                    onMouseLeave={currentMedia?.type !== 'video' ? handleMouseLeave : undefined}
                    onClick={handleMainImageClick}
                >
                    {currentMedia?.type === 'video' ? (
                         <video 
                            src={currentMedia.url} 
                            controls 
                            autoPlay 
                            loop 
                            muted 
                            className="w-full h-full object-contain bg-black cursor-default"
                            onClick={(e) => e.stopPropagation()} 
                         />
                    ) : (
                        <img 
                            src={currentMedia?.url} 
                            alt="view" 
                            className="w-full h-full object-cover transition-transform duration-200 ease-out origin-center pointer-events-none" 
                            style={zoomStyle}
                        />
                    )}

                    {/* Navigation Overlays */}
                    {mediaItems.length > 1 && (
                        <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-10 hidden md:block"
                                aria-label="Previous Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none z-10 hidden md:block"
                                aria-label="Next Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                            
                            {/* Mobile Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden pointer-events-none z-10">
                                {mediaItems.map((_, idx) => (
                                    <div key={idx} className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 w-1.5'}`}></div>
                                ))}
                            </div>
                        </>
                    )}
                    
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                    </div>
                </div>
                
                {/* Thumbnails */}
                <div 
                    ref={thumbnailRef}
                    className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
                >
                    {mediaItems.map((item, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentImageIndex(idx)} 
                            className={`w-20 h-24 shrink-0 rounded border-2 overflow-hidden transition-all duration-200 ${
                                currentImageIndex === idx 
                                ? 'border-rani-500 ring-2 ring-rani-500/30 opacity-100 scale-105' 
                                : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                            <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col">
                <div className="mb-6">
                    <h2 className="text-xs text-rani-600 font-black tracking-[0.2em] uppercase mb-1">{product.category}</h2>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold text-luxury-black mb-2">{product.name}</h1>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>
                    </div>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex flex-col">
                        <p className="text-3xl font-bold text-luxury-black">₹{pricing.perPiece.toLocaleString()}<span className="text-sm font-normal text-gray-500 ml-1">/ piece (Ex-Factory)</span></p>
                        <p className="text-sm font-bold text-rani-600 mt-1 bg-rani-50 inline-block px-2 py-1 rounded">
                            ₹{pricing.perSet.toLocaleString()} per Set of {currentVariant?.piecesPerSet || 6} pieces
                        </p>
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">Fabric: {product.fabric}</span>
                        <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">MOQ: 1 Set</span>
                    </div>
                </div>

                {user && (
                    <div className={`p-4 rounded-xl border mb-8 flex items-center justify-between ${isEligibleForCredit ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{isEligibleForCredit ? '✅' : '⚠️'}</span>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${isEligibleForCredit ? 'text-green-800' : 'text-red-800'}`}>
                                    {isEligibleForCredit ? 'Credit Eligible' : 'Credit Limit Low'}
                                </p>
                                <p className="text-[10px] text-gray-500">Based on your ledger statement and this lot size.</p>
                            </div>
                        </div>
                        {!isEligibleForCredit && (
                            <button onClick={() => navigate('/ledger')} className="text-[10px] font-black uppercase text-red-600 underline">Request Increase</button>
                        )}
                    </div>
                )}

                <div className="space-y-6 mb-8">
                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 block mb-3 tracking-widest">Available Colors</label>
                        <div className="flex flex-wrap gap-3">
                            {uniqueColors.map(color => (
                                <button key={color} onClick={() => setSelectedColor(color)} className={`w-10 h-10 rounded-full border transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-rani-500 scale-110' : 'border-gray-200'}`}>
                                    <div className="w-full h-full rounded-full" style={{ backgroundColor: getColorValue(color) }} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-black uppercase text-gray-400 block mb-3 tracking-widest">Select Size Range (Sold in Sets)</label>
                        <div className="flex flex-wrap gap-2">
                            {uniqueRanges.map(range => (
                                <button key={range} onClick={() => setSelectedRange(range)} className={`px-4 py-2 border rounded text-sm font-bold transition-all ${selectedRange === range ? 'bg-rani-500 border-rani-500 text-white shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-rani-200'}`}>
                                    Range: {range}
                                </button>
                            ))}
                        </div>
                        {currentVariant && (
                            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                                <span className="text-lg">📦</span>
                                <p className="text-[10px] text-gray-500 leading-tight">
                                    <span className="font-bold text-gray-700 block mb-1 uppercase tracking-tighter">B2B Standard Packaging</span>
                                    This set contains <strong>{currentVariant.piecesPerSet} pieces</strong> covering sizes in the {currentVariant.sizeRange} range with standard jumps.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-auto bg-luxury-black p-6 rounded-2xl shadow-xl text-white">
                    <div className="flex items-center gap-4 mb-4">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order Qty (Sets):</label>
                        <select 
                            value={qtySets} 
                            onChange={(e) => setQtySets(Number(e.target.value))} 
                            className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 outline-none focus:border-rani-500"
                        >
                            {[1, 2, 3, 5, 10, 20, 50, 100].map(n => <option key={n} value={n}>{n} Sets ({n * (currentVariant?.piecesPerSet || 6)} Pcs)</option>)}
                        </select>
                    </div>
                    <div className="flex justify-between items-center mb-6 border-t border-white/10 pt-4">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Wholesale Total:</span>
                        <span className="text-3xl font-black text-white">₹{pricing.total.toLocaleString()}</span>
                    </div>
                    <Button 
                        fullWidth 
                        size="lg"
                        onClick={handleAddToCart} 
                        disabled={!currentVariant || currentVariant.stock === 0}
                        className="h-14 font-black uppercase tracking-widest shadow-2xl shadow-rani-500/20"
                    >
                        {currentVariant?.stock === 0 ? 'Notify Me When Available' : 'Add Sets to Order'}
                    </Button>
                </div>
            </div>
        </div>

        {/* Reviews Section */}
        <div className="container mx-auto px-4 py-12 border-t border-gray-100">
            <h3 className="text-2xl font-bold font-heading mb-8 text-luxury-black">Customer Reviews</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    {reviews.length === 0 ? (
                        <div className="p-8 bg-gray-50 rounded-xl text-center text-gray-500 italic">No reviews yet. Be the first to share your feedback!</div>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-rani-100 text-rani-600 rounded-full flex items-center justify-center font-bold text-xs">
                                            {review.userName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">{review.userName}</p>
                                            <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex">{renderStars(review.rating)}</div>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mt-2">{review.comment}</p>
                            </div>
                        ))
                    )}
                </div>

                {user ? (
                    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 h-fit">
                        <h4 className="font-bold text-lg mb-4 text-gray-800">Write a Review</h4>
                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Your Rating</label>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            type="button" 
                                            key={star} 
                                            onClick={() => setUserRating(star)} 
                                            className={`text-2xl ${userRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Review</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:border-rani-500 h-24 bg-white" 
                                    placeholder="Share your experience with this product..." 
                                    value={userComment}
                                    onChange={e => setUserComment(e.target.value)}
                                    required
                                />
                            </div>
                            <Button fullWidth disabled={submittingReview}>
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center flex flex-col items-center justify-center">
                        <p className="text-gray-500 mb-4">Please login to write a review.</p>
                        <Button onClick={() => navigate('/login')} variant="outline">Login</Button>
                    </div>
                )}
            </div>
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-fade-in touch-none" onClick={() => setIsLightboxOpen(false)}>
                <button className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full z-10 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                    <img 
                        src={currentMedia?.url} 
                        alt="Zoom View" 
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
                    {mediaItems.map((_, idx) => (
                        <button 
                            key={idx} 
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                            className={`w-3 h-3 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white scale-125' : 'bg-white/30 hover:bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
