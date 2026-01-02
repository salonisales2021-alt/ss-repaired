import React from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';

export const Wishlist: React.FC = () => {
    const { user, products, toggleWishlist, addToCart } = useApp();
    const navigate = useNavigate();

    // Ensure wishlist is loaded
    const wishlistIds = user?.wishlist || [];
    const wishlistItems = products.filter(p => wishlistIds.includes(p.id));

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h1>
                <Button onClick={() => navigate('/login')}>Login</Button>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold font-heading text-gray-800">My Wishlist ({wishlistItems.length})</h1>
                    <Button variant="outline" size="sm" onClick={() => navigate('/shop')}>Continue Shopping</Button>
                </div>

                {wishlistItems.length === 0 ? (
                    <div className="bg-white p-12 rounded-lg shadow-sm text-center border border-gray-200">
                        <div className="text-gray-300 mb-4 text-5xl">♥</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 mb-6">Save designs you love here to order them later.</p>
                        <Button onClick={() => navigate('/shop')}>Explore Collection</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {wishlistItems.map(p => {
                            const stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                            return (
                                <div key={p.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="relative aspect-[3/4] bg-gray-100 cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                                            className="absolute top-2 right-2 bg-white p-2 rounded-full text-red-500 shadow-md hover:bg-red-50 transition-colors"
                                            title="Remove"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        {stock === 0 && (
                                            <div className="absolute inset-0 bg-white/50 flex items-center justify-center backdrop-blur-[1px]">
                                                <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 uppercase rounded">Out of Stock</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-gray-800 line-clamp-1 mb-1">{p.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">{p.sku}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-rani-600">₹{p.basePrice}</span>
                                            {stock > 0 && (
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => addToCart(p, p.variants.find(v => v.stock > 0) || p.variants[0], 1)}
                                                    className="px-3 py-1 h-auto text-xs"
                                                >
                                                    Add to Cart
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};