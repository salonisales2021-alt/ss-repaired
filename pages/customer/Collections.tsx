
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleGenAI, Type } from "@google/genai";
import { Button } from '../../components/Button';
import { Product } from '../../types';
import { parseAIJson } from '../../services/db';

export const Collections: React.FC = () => {
    const { products } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    const [scoutImage, setScoutImage] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [matchedProducts, setMatchedProducts] = useState<Product[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Standard Grouping for the bottom section
    const collections = products.reduce((acc, product) => {
        const colName = product.collection || 'General';
        if (!acc[colName]) acc[colName] = [];
        acc[colName].push(product);
        return acc;
    }, {} as Record<string, typeof products>);

    const collectionNames = Object.keys(collections).sort();

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            setScoutImage(base64);
            performVisualScout(base64.split(',')[1], file.type);
        };
        reader.readAsDataURL(file);
    };

    const performVisualScout = async (base64Data: string, mimeType: string) => {
        setIsAnalyzing(true);
        setMatchedProducts([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Build context for AI to map styles
            const catalogSummary = products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                fabric: p.fabric,
                keywords: `${p.name} ${p.fabric} ${p.category} ${p.description}`
            }));

            const prompt = `Analyze this fashion reference image. Identify its core aesthetic (colors, fabric type, silhouette). 
            From the following catalog list, return the top 4 Product IDs that most closely match the style in the image.
            
            Catalog: ${JSON.stringify(catalogSummary.slice(0, 50))}
            
            Return ONLY a JSON array of string IDs.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { data: base64Data, mimeType } },
                        { text: prompt }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });

            const matchedIds = parseAIJson<string[]>(response.text, []);
            const matches = products.filter(p => matchedIds.includes(p.id));
            setMatchedProducts(matches);

        } catch (error) {
            console.error("Scout Error:", error);
            alert("Could not process image. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white min-h-screen pb-20 animate-fade-in">
            {/* AI Visual Scout Hero */}
            <div className="bg-luxury-black text-white py-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-rani-500/20 rounded-full blur-[120px] -mr-48 -mt-48"></div>
                <div className="container mx-auto max-w-4xl relative z-10">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-heading font-black mb-4 uppercase tracking-tighter italic">
                            {t('scout.title')} <span className="text-rani-500">BETA</span>
                        </h1>
                        <p className="text-gray-400 text-lg">{t('scout.subtitle')}</p>
                    </div>

                    <div 
                        className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center min-h-[250px] cursor-pointer
                            ${scoutImage ? 'border-rani-500 bg-white/5' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'}
                        `}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} />
                        
                        {scoutImage ? (
                            <div className="flex flex-col items-center gap-4 animate-fade-in">
                                <img src={scoutImage} alt="Ref" className="h-32 w-32 object-cover rounded-lg border-2 border-rani-500 shadow-xl" />
                                {isAnalyzing ? (
                                    <p className="text-rani-400 font-bold animate-pulse flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        {t('scout.analyzing')}
                                    </p>
                                ) : (
                                    <Button variant="outline" className="text-white border-white/20">Change Image</Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-gray-500 font-medium">{t('scout.dropzone')}</p>
                            </>
                        )}
                    </div>
                    <p className="mt-6 text-center text-xs text-gray-500 max-w-xl mx-auto">{t('scout.howItWorks')}</p>
                </div>
            </div>

            {/* Scout Results */}
            {matchedProducts.length > 0 && (
                <div className="bg-gray-50 border-y border-gray-200 py-16 animate-fade-in-up">
                    <div className="container mx-auto px-4">
                        <h3 className="text-2xl font-bold mb-8 text-luxury-black">{t('scout.matches')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {matchedProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    className="bg-white p-2 rounded-xl shadow-md cursor-pointer hover:-translate-y-1 transition-all group"
                                    onClick={() => navigate(`/product/${product.id}`)}
                                >
                                    <div className="aspect-[3/4] rounded-lg overflow-hidden relative mb-4">
                                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute top-2 left-2 bg-rani-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">95% Match</div>
                                    </div>
                                    <div className="px-2 pb-2 text-center">
                                        <h4 className="font-bold text-gray-800 text-sm truncate">{product.name}</h4>
                                        <p className="text-rani-600 font-bold text-lg mt-1">₹{product.basePrice}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Static Collection Display (Legacy) */}
            <div className="container mx-auto px-4 py-20 space-y-24">
                {collectionNames.map((name, idx) => {
                    const items = collections[name].slice(0, 4);
                    return (
                        <div key={name} className="flex flex-col gap-8">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold font-heading text-gray-800">{name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">{collections[name].length} Designs</p>
                                </div>
                                <button 
                                    onClick={() => navigate(`/shop?search=${encodeURIComponent(name)}`)}
                                    className="px-6 py-2 border border-luxury-black hover:bg-luxury-black hover:text-white transition-all uppercase text-xs font-bold tracking-widest"
                                >
                                    View All
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {items.map(product => (
                                    <div 
                                        key={product.id} 
                                        className="group cursor-pointer"
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    >
                                        <div className="aspect-[3/4] overflow-hidden mb-4 relative">
                                            <img 
                                                src={product.images[0]} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-rani-600 transition-colors line-clamp-1">{product.name}</h3>
                                        <p className="text-xs text-gray-500 mt-1">₹{product.basePrice}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
