import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { LockScreen } from '../../components/LockScreen';

export const CustomerHome: React.FC = () => {
  const navigate = useNavigate();
  const { user, heroVideoUrl, products } = useApp();
  const { t } = useLanguage();

  return (
    <div className="bg-white min-h-screen pb-20 animate-fade-in">
      
      {/* NEW HERO SECTION: Design-Led Studio Style */}
      <div className="relative w-full bg-[#FDFBF7] overflow-hidden min-h-[85vh] flex items-center border-b border-gray-100">
        <div className="container mx-auto px-6 h-full flex flex-col md:flex-row items-center relative z-10">
            
            {/* Text Content */}
            <div className="w-full md:w-1/2 pt-20 pb-12 md:py-0 md:pr-12">
                <div className="animate-fade-in-up">
                    <h1 className="text-5xl md:text-7xl font-heading text-gray-900 leading-[1.1] mb-6 tracking-tight">
                        Design-Led Girlswear.<br />
                        <span className="text-gray-500 font-normal font-sans tracking-tight">Built for B2B.</span>
                    </h1>
                    
                    <p className="text-gray-500 text-lg mb-10 max-w-lg font-light leading-relaxed">
                        Predictable production. Consistent quality. On-time delivery.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-16">
                        {!user ? (
                            <Button 
                                size="lg" 
                                onClick={() => navigate('/register')} 
                                className="bg-gray-900 text-white hover:bg-gray-800 rounded-sm px-10 h-14 font-medium shadow-xl tracking-wide uppercase text-xs"
                            >
                                Become a Partner
                            </Button>
                        ) : (
                            <Button 
                                size="lg" 
                                onClick={() => navigate('/shop')} 
                                className="bg-gray-900 text-white hover:bg-gray-800 rounded-sm px-10 h-14 font-medium shadow-xl tracking-wide uppercase text-xs"
                            >
                                Shop Wholesale
                            </Button>
                        )}
                        <Button 
                            size="lg" 
                            variant="outline" 
                            onClick={() => navigate('/shop')} 
                            className="border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-900 hover:bg-transparent rounded-sm px-10 h-14 font-medium tracking-wide uppercase text-xs bg-transparent"
                        >
                            View Collection
                        </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-400 font-bold uppercase tracking-[0.15em] items-center">
                        <span>B2B Only</span>
                        <span className="w-px h-3 bg-gray-300 hidden sm:block"></span>
                        <span>Girlswear Specialists</span>
                        <span className="w-px h-3 bg-gray-300 hidden sm:block"></span>
                        <span>Ethically Produced</span>
                        <span className="w-px h-3 bg-gray-300 hidden sm:block"></span>
                        <span>Designed for Scale</span>
                    </div>
                </div>
            </div>

            {/* Right Image */}
            <div className="w-full md:w-1/2 h-[500px] md:h-[85vh] relative mt-8 md:mt-0">
                 {/* Soft gradient to blend image with text area on smaller screens */}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#FDFBF7] via-transparent to-transparent md:bg-gradient-to-r md:w-1/4 z-10"></div>
                 
                 {heroVideoUrl ? (
                    <video src={heroVideoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover object-top" />
                 ) : (
                    <img 
                        src="https://tikuoenvshrrweahpvpb.supabase.co/storage/v1/object/public/saloniAssets/websiteAssets/Gemini_Generated_Image_32dwlh32dwlh32dw.png"
                        alt="Saloni Girls Fashion Studio Collection"
                        className="w-full h-full object-cover object-top md:object-center shadow-2xl md:shadow-none"
                    />
                 )}
            </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white py-8 border-b border-gray-100">
          <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all">
              {['Premium Fabrics', 'Factory Prices', 'Pan-India Delivery', 'GST Compliant', '500+ Unique Designs'].map(badge => (
                  <span key={badge} className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{badge}</span>
              ))}
          </div>
      </div>

      {/* Categories */}
      <div className="container mx-auto px-4 mt-20 relative z-10">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-gray-900">Curated Collections</h2>
            <div className="w-12 h-1 bg-gray-900 mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                { title: 'Western Wear', img: 'https://tikuoenvshrrweahpvpb.supabase.co/storage/v1/object/public/saloniAssets/websiteAssets/Gemini_Generated_Image_5n7ne15n7ne15n7n.png', link: 'Western', sub: 'Frocks & Party Wear' },
                { title: 'Ethnic Elegance', img: 'https://tikuoenvshrrweahpvpb.supabase.co/storage/v1/object/public/saloniAssets/websiteAssets/Gemini_Generated_Image_o9sxbpo9sxbpo9sx.png', link: 'Ethnic', sub: 'Lehengas & Suits' },
                { title: 'Indo-Western', img: 'https://tikuoenvshrrweahpvpb.supabase.co/storage/v1/object/public/saloniAssets/websiteAssets/Gemini_Generated_Image_9zvgcy9zvgcy9zvg.png', link: 'Indo-Western', sub: 'Fusion Collection' }
            ].map((cat, idx) => (
                <div 
                    key={idx} 
                    className="bg-white shadow-sm hover:shadow-2xl border border-gray-100 rounded-sm cursor-pointer group overflow-hidden relative transition-all duration-500" 
                    onClick={() => navigate(`/shop?cat=${cat.link}`)}
                >
                    <div className="overflow-hidden h-[400px]">
                        <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    </div>
                    <div className="p-6 text-center absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-[10px] text-rani-600 font-bold uppercase tracking-widest mb-1">{cat.sub}</p>
                        <h3 className="text-xl font-bold font-heading text-luxury-black transition-colors">{cat.title}</h3>
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Franchise Partnership Dialogue */}
      <div className="container mx-auto px-4 mt-24">
          <div className="bg-luxury-black rounded-3xl overflow-hidden relative border border-gray-800 shadow-2xl group">
              <div className="absolute top-0 right-0 w-1/3 h-full overflow-hidden opacity-40 hidden lg:block">
                  <img 
                    src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e12?q=80&w=800&auto=format&fit=crop" 
                    className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[5s]" 
                    alt="Luxury Interior"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-luxury-black"></div>
              </div>
              
              <div className="p-8 md:p-16 relative z-10 lg:max-w-2xl">
                  <span className="text-rani-500 font-black uppercase tracking-[0.3em] text-xs mb-4 block">{t('franchise.benefitTitle')}</span>
                  <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-6 leading-tight uppercase tracking-tighter italic">
                      {t('franchise.title')}
                  </h2>
                  <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                      {t('franchise.subtitle')} Join India's fastest-growing premium kids wear network with proven retail success.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                      {[
                          { icon: '💰', text: t('franchise.benefit1') },
                          { icon: '📍', text: t('franchise.benefit2') },
                          { icon: '🎨', text: t('franchise.benefit3') }
                      ].map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
                              <span className="text-2xl">{benefit.icon}</span>
                              <span className="text-[11px] font-black text-white uppercase tracking-wider leading-tight">{benefit.text}</span>
                          </div>
                      ))}
                  </div>
                  
                  <Button size="lg" onClick={() => navigate('/franchise-enquiry')} className="h-16 px-12 text-lg shadow-xl shadow-rani-500/20">
                      {t('franchise.cta')}
                  </Button>
              </div>
              
              {/* Abstract Design Elements */}
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-rani-500/10 rounded-full blur-3xl"></div>
          </div>
      </div>

      {/* Featured Dashboard for Logged In User */}
      {user && (
        <div className="container mx-auto px-4 mt-20">
            <div className="bg-luxury-black p-8 md:p-12 border border-gray-800 shadow-2xl rounded-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rani-500/10 rounded-full blur-[100px] -z-0"></div>
                <div className="text-center md:text-left z-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white font-heading">{t('home.welcomeBack')}, {user.businessName || user.fullName}</h2>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{t('home.creditLimit')}</p>
                            <span className="font-bold text-green-400 text-lg">₹{user.creditLimit?.toLocaleString()}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg">
                            <p className="text-gray-500 text-[10px] uppercase font-bold mb-1">{t('home.outstanding')}</p>
                            <span className="font-bold text-red-400 text-lg">₹{user.outstandingDues?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto z-10">
                    <Button variant="primary" onClick={() => navigate('/book-visit')} fullWidth className="md:min-w-[180px]">{t('home.bookVisit')}</Button>
                    <Button variant="outline" onClick={() => navigate('/orders')} fullWidth className="md:min-w-[180px] text-white border-white/20 hover:bg-white/10">{t('home.orderHistory')}</Button>
                </div>
            </div>
        </div>
      )}

      {/* Featured Products */}
      <div className="container mx-auto px-4 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-4">
            <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-luxury-black mb-2">{t('home.trending')}</h2>
                <div className="w-20 h-1 bg-rani-500 mx-auto md:mx-0"></div>
            </div>
            {user && <Link to="/shop" className="text-rani-600 font-bold hover:underline flex items-center gap-2 group">{t('home.seeAll')} <span className="group-hover:translate-x-1 transition-transform">→</span></Link>}
        </div>
        
        {!user ? (
            <div className="relative">
                <LockScreen />
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {products.slice(0, 4).map(product => (
                    <div 
                        key={product.id} 
                        className="bg-white border border-gray-100 hover:border-rani-200 hover:shadow-2xl transition-all duration-500 rounded-xl group cursor-pointer overflow-hidden flex flex-col"
                        onClick={() => navigate(`/product/${product.id}`)}
                    >
                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                            <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute top-3 left-3">
                                <span className="bg-white/80 backdrop-blur-sm text-[10px] font-black text-luxury-black px-2 py-1 rounded shadow-sm border border-gray-100">NEW ARRIVAL</span>
                            </div>
                            {!product.isAvailable && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                                    <span className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-xl">{t('home.outOfStock')}</span>
                                </div>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="text-[10px] text-rani-600 font-black uppercase tracking-wider mb-2">{product.category}</div>
                            <h3 className="font-bold text-luxury-black line-clamp-2 mb-4 text-lg leading-tight group-hover:text-rani-600 transition-colors">{product.name}</h3>
                            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                                <span className="text-2xl font-black text-luxury-black">₹{product.basePrice}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{product.fabric}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};