
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from '../../components/Button';
import { Product, ProductVariant } from '../../types';
import { LockScreen } from '../../components/LockScreen';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CatalogNarrator } from '../../components/CatalogNarrator';

export const Shop: React.FC = () => {
  const { addToCart, user, products, calculatePrice } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Params for initial state
  const initialCategory = searchParams.get('cat') || 'All';
  const searchTerm = searchParams.get('search') || '';

  // Local State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedFabric, setSelectedFabric] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<number>(5000);
  const [showFilters, setShowFilters] = useState(false); // Mobile filter toggle
  
  // Quick Add State
  const [expandedProduct, setExpandedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const cat = searchParams.get('cat');
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  const fabrics = useMemo(() => {
    const uniqueFabrics = new Set(products.map(p => p.fabric));
    return ['All', ...Array.from(uniqueFabrics).sort()];
  }, [products]);

  // --- Advanced Search Logic ---
  const searchTokens = useMemo(() => {
    if (!searchTerm) return [];
    // Split by comma or space, remove empty, remove generic stop words
    return searchTerm.toLowerCase()
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(s => s.length > 1 && !['for', 'the', 'in', 'and', 'with', 'wear', 'kids', 'girl'].includes(s));
  }, [searchTerm]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Scoring & Search Relevance
    if (searchTokens.length > 0) {
        result = result.map(p => {
            let score = 0;
            const name = p.name.toLowerCase();
            const cat = p.category.toLowerCase();
            const fab = p.fabric.toLowerCase();
            const variantsText = p.variants.map(v => `${v.color} ${v.sizeRange}`).join(' ').toLowerCase();
            const sku = p.sku.toLowerCase();

            searchTokens.forEach(token => {
                // Exact matches get higher points
                if (name === token) score += 10;
                else if (name.includes(token)) score += 5;
                
                if (cat.includes(token)) score += 3;
                if (fab.includes(token)) score += 3;
                if (sku.includes(token)) score += 10; // High priority for SKU
                
                // Deep search in variants (colors/sizes)
                if (variantsText.includes(token)) score += 4;
                
                // Broad match in collection name
                if (p.collection && p.collection.toLowerCase().includes(token)) score += 2;
            });

            return { p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.p);
    }

    // 2. Apply Filters (AND Logic)
    return result.filter(p => {
        const matchCat = selectedCategory === 'All' || p.category.includes(selectedCategory);
        const matchFabric = selectedFabric === 'All' || p.fabric === selectedFabric;
        const matchPrice = p.basePrice <= priceRange;
        const hasStock = p.variants.some(v => v.stock > 0);
        const matchStock = !inStockOnly || (p.isAvailable && hasStock);

        return matchCat && matchFabric && matchPrice && matchStock;
    });
  }, [products, searchTokens, selectedCategory, selectedFabric, inStockOnly, priceRange]);

  if (!user) {
    return (
        <div className="container mx-auto px-4 py-12">
            <div className="mb-12 text-center max-w-2xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">{t('shop.title')}</h1>
                <p className="text-gray-500 text-base md:text-lg">Browse our complete catalog of premium Western, Ethnic, and Indo-Western wear.</p>
            </div>
            <LockScreen />
        </div>
    );
  }

  const handleQuickAdd = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProduct(p);
    const firstAvail = p.variants.find(v => v.stock > 0);
    setSelectedVariant(firstAvail || null);
    setQty(1);
  };

  const confirmAdd = () => {
    if (expandedProduct && selectedVariant) {
        addToCart(expandedProduct, selectedVariant, qty);
        setExpandedProduct(null);
        setSelectedVariant(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedFabric('All');
    setInStockOnly(false);
    setPriceRange(5000);
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8 relative">
      
      {/* Mobile Filter Toggle */}
      <div className="md:hidden mb-4">
          <Button variant="outline" fullWidth onClick={() => setShowFilters(!showFilters)} className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {showFilters ? t('shop.hideFilters') : t('shop.showFilters')}
          </Button>
      </div>

      {/* Sidebar Filters */}
      <aside className={`fixed md:relative inset-0 z-40 bg-white md:bg-transparent p-6 md:p-0 overflow-y-auto transition-transform duration-300 transform ${showFilters ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} w-3/4 md:w-64 shrink-0 shadow-2xl md:shadow-none`}>
        <div className="flex justify-between items-center md:hidden mb-6">
            <h2 className="text-xl font-bold">{t('shop.filters')}</h2>
            <button onClick={() => setShowFilters(false)} className="text-gray-500">✕</button>
        </div>

        <div className="space-y-8">
            <div>
                <h3 className="font-bold text-lg mb-4">{t('shop.category')}</h3>
                <div className="space-y-3">
                    {['All', 'Western', 'Ethnic', 'Indo-Western'].map(c => (
                        <label key={c} className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="cat" className="w-4 h-4 accent-rani-500" checked={selectedCategory === c} onChange={() => { setSelectedCategory(c); setShowFilters(false); }} />
                            <span className={`text-sm ${selectedCategory === c ? 'font-bold text-rani-600' : 'text-gray-600'}`}>{c}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-rani-50/50 p-4 rounded-lg border border-rani-100">
                <CatalogNarrator category={selectedCategory} />
            </div>

            <div>
                <h3 className="font-bold text-lg mb-4">{t('shop.fabric')}</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pr-2">
                    {fabrics.map(f => (
                        <label key={f} className="flex items-center gap-3 cursor-pointer">
                            <input type="radio" name="fabric" className="w-4 h-4 accent-rani-500 shrink-0" checked={selectedFabric === f} onChange={() => { setSelectedFabric(f); setShowFilters(false); }} />
                            <span className={`text-sm ${selectedFabric === f ? 'font-bold text-rani-600' : 'text-gray-600'}`}>{f}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-4">{t('shop.maxPrice')}</h3>
                <input type="range" min="500" max="5000" step="100" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="w-full accent-rani-500" />
                <div className="text-sm text-gray-600 mt-2 font-medium">{t('shop.upTo')} ₹{priceRange}</div>
            </div>

            <div>
                <h3 className="font-bold text-lg mb-4">{t('shop.availability')}</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-rani-500 rounded" checked={inStockOnly} onChange={(e) => { setInStockOnly(e.target.checked); setShowFilters(false); }} />
                    <span className={`text-sm ${inStockOnly ? 'font-bold text-rani-600' : 'text-gray-600'}`}>{t('shop.inStockOnly')}</span>
                </label>
            </div>

            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 underline font-medium">{t('shop.reset')}</button>
        </div>
      </aside>
      
      {showFilters && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setShowFilters(false)}></div>}

      {/* Product Grid */}
      <div className="flex-1">
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-xl md:text-2xl font-bold font-heading">{t('shop.title')}</h1>
                <div className="flex items-center gap-2 mt-1">
                     <span className="text-xs md:text-sm text-gray-500">{filteredProducts.length} {t('shop.results')}</span>
                     {searchTerm && (
                         <div className="flex items-center gap-1">
                             <span className="text-xs bg-rani-50 px-2 py-0.5 rounded text-rani-700 font-bold border border-rani-100 line-clamp-1 max-w-[200px]" title={searchTerm}>
                                 Query: "{searchTerm}"
                             </span>
                             <button onClick={() => { setSearchParams({}); }} className="text-gray-400 hover:text-red-500">×</button>
                         </div>
                     )}
                </div>
            </div>
            
            <select className="bg-white border border-gray-200 text-sm rounded px-3 py-1.5 outline-none focus:border-rani-500 text-gray-600">
                <option>{t('shop.sortBy')}: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
            </select>
        </div>

        {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-800 font-bold mb-1">No matches found.</p>
                <p className="text-gray-500 text-sm mb-4">Try checking your spelling or using different keywords.</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>Reset Filters</Button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => {
                    const isOutOfStock = !product.isAvailable || product.variants.every(v => v.stock === 0);
                    // Fix: destructured only finalPrice as originalPrice is not returned by calculatePrice in AppContext
                    const { finalPrice } = calculatePrice(product.basePrice, 1, 1);

                    return (
                        <div key={product.id} className="bg-white border border-gray-200 rounded-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                            <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden group">
                                <img src={product.images[0]} alt={product.name} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'grayscale opacity-80' : ''}`} />
                                
                                {isOutOfStock && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                        <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest shadow-lg transform -rotate-6">Out of Stock</span>
                                    </div>
                                )}

                                {!isOutOfStock && (
                                    <>
                                        <div className="absolute inset-x-0 bottom-0 bg-white/95 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 shadow-lg hidden md:block">
                                            <Button size="sm" fullWidth onClick={(e) => handleQuickAdd(product, e)}>{t('shop.quickView')}</Button>
                                        </div>
                                        <button className="md:hidden absolute bottom-2 right-2 bg-white text-rani-600 p-2 rounded-full shadow-lg" onClick={(e) => handleQuickAdd(product, e)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 flex justify-between">
                                    <span>{product.category}</span>
                                    <span className="text-gray-400">{product.fabric}</span>
                                </div>
                                <h3 className="font-bold text-gray-800 text-base md:text-lg leading-tight mb-2 line-clamp-2">{product.name}</h3>
                                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                     <div className="flex flex-col">
                                         <span className="text-[10px] text-gray-400">{t('shop.yourPrice')}</span>
                                         <div className="flex items-center gap-2">
                                            <span className="text-lg md:text-xl font-bold text-luxury-black">₹{finalPrice}</span>
                                         </div>
                                     </div>
                                     <span className={`text-[10px] font-medium px-2 py-1 rounded ${isOutOfStock ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                         {isOutOfStock ? 'Sold Out' : 'In Stock'}
                                     </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Quick View Modal */}
      {expandedProduct && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setExpandedProduct(null)}>
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden animate-fade-in flex flex-col md:flex-row max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 bg-gray-100 h-48 md:h-auto shrink-0 cursor-pointer" onClick={() => navigate(`/product/${expandedProduct.id}`)}>
                    <img src={expandedProduct.images[0]} className="w-full h-full object-cover" alt={expandedProduct.name} />
                </div>
                <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-lg md:text-xl font-bold hover:text-rani-600 cursor-pointer" onClick={() => navigate(`/product/${expandedProduct.id}`)}>{expandedProduct.name}</h2>
                        <button onClick={() => setExpandedProduct(null)} className="text-gray-400 hover:text-black p-2">✕</button>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6">{expandedProduct.description}</p>
                    
                    <div className="space-y-4 mb-8">
                        <div>
                            <label className="block text-sm font-bold mb-2">{t('shop.selectVariant')}</label>
                            <div className="flex flex-wrap gap-2">
                                {expandedProduct.variants.map(v => (
                                    <button 
                                        key={v.id}
                                        onClick={() => setSelectedVariant(v)}
                                        disabled={v.stock === 0}
                                        className={`px-3 py-2 border text-sm rounded-sm transition-all ${selectedVariant?.id === v.id ? 'border-rani-500 bg-rani-50 text-rani-700 font-bold ring-1 ring-rani-500' : 'border-gray-200 hover:border-gray-400'} ${v.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
                                    >
                                        {v.color} - {v.sizeRange}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedVariant && (
                            <div className="flex items-end justify-between bg-gray-50 p-3 rounded">
                                <div>
                                    <div className="text-xs text-gray-500">{t('shop.pricePerUnit')}</div>
                                    <div className="text-xl font-bold">
                                        {/* Fix: price -> pricePerPiece, calculatePrice args updated */}
                                        ₹{calculatePrice(selectedVariant.pricePerPiece, selectedVariant.piecesPerSet, qty).finalPrice}
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className="text-xs text-gray-500 mb-1">{t('shop.quantity')}</div>
                                     <select className="border border-gray-300 rounded px-2 py-1 bg-white" value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                                        {[1,2,3,4,5,10,20].map(n => <option key={n} value={n}>{n}</option>)}
                                     </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto flex flex-col gap-2">
                        <Button fullWidth onClick={confirmAdd} disabled={!selectedVariant}>{t('shop.addToOrder')}</Button>
                        <Button variant="text" size="sm" onClick={() => navigate(`/product/${expandedProduct.id}`)}>{t('shop.viewDetails')}</Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
