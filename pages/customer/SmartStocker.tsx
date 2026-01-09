
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { GoogleGenAI, Type } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { Product, ProductVariant } from '../../types';
import { useNavigate } from 'react-router-dom';
import { parseAIJson, getGeminiKey, handleAiError } from '../../services/db';

interface BundleItem {
    productId: string;
    variantId: string;
    quantity: number;
    reason: string;
    
    // Resolved Data
    product?: Product;
    variant?: ProductVariant;
}

export const SmartStocker: React.FC = () => {
    const { products, addToCart, calculatePrice } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();

    // Inputs
    const [budget, setBudget] = useState<number>(20000);
    const [location, setLocation] = useState('');
    const [customerType, setCustomerType] = useState('Mixed'); // Premium, Budget, Mixed
    const [season, setSeason] = useState('Current Season');

    // Output
    const [bundle, setBundle] = useState<BundleItem[]>([]);
    const [strategy, setStrategy] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setBundle([]);
        setStrategy('');

        try {
            const apiKey = getGeminiKey();
            if (!apiKey) {
                alert("API Key is missing. Please configure it in Admin Settings or use the Connect button.");
                setIsGenerating(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey });

            // 1. Prepare Product Context (Simplified to save tokens)
            // We send ID, Name, Category, Fabric, Base Price, and Available Variants
            const catalogContext = products.map(p => ({
                id: p.id,
                name: p.name,
                category: p.category,
                fabric: p.fabric,
                price: p.basePrice,
                // Fix: size -> sizeRange
                variants: p.variants.filter(v => v.stock > 0).map(v => ({ id: v.id, name: `${v.color} ${v.sizeRange}` }))
            }));

            // 2. Prompt Engineering
            const prompt = `
                Act as a Senior Merchandiser for Saloni Sales (Kids Wear B2B).
                Create a stock plan for a retailer.
                
                Retailer Details:
                - Budget: ₹${budget}
                - Location: ${location}
                - Customer Type: ${customerType}
                - Season Focus: ${season}
                
                Catalog Available:
                ${JSON.stringify(catalogContext)}
                
                Task:
                1. Select a mix of products that fit the budget (Total value should be close to ₹${budget}, do not exceed by more than 10%).
                2. Choose specific variants (IDs provided).
                3. Determine quantities (Minimum 1).
                4. Explain the strategy (Why these items for this location/budget?).
                
                Return JSON format.
            `;

            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                productId: { type: Type.STRING },
                                variantId: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                reason: { type: Type.STRING }
                            },
                            required: ["productId", "variantId", "quantity", "reason"]
                        }
                    },
                    strategySummary: { type: Type.STRING }
                },
                required: ["items", "strategySummary"]
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });

            const result = parseAIJson<{ items: any[], strategySummary: string }>(response.text || '', { items: [], strategySummary: '' });
            
            // 3. Hydrate Result with Real Objects
            if (result.items) {
                const hydratedBundle = result.items.map((item: any) => {
                    const prod = products.find(p => p.id === item.productId);
                    const vari = prod?.variants.find(v => v.id === item.variantId);
                    return {
                        ...item,
                        product: prod,
                        variant: vari
                    };
                }).filter((i: any) => i.product && i.variant); // Remove invalid matches

                setBundle(hydratedBundle);
                setStrategy(result.strategySummary);
            }

        } catch (error) {
            await handleAiError(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddAll = () => {
        let count = 0;
        bundle.forEach(item => {
            if (item.product && item.variant) {
                addToCart(item.product, item.variant, item.quantity);
                count++;
            }
        });
        if (count > 0) {
            alert(`Added ${count} items to cart!`);
            navigate('/cart');
        }
    };

    // Calculations
    const bundleTotal = bundle.reduce((sum, item) => {
        if (!item.variant) return sum;
        const { finalPrice } = calculatePrice(item.variant.pricePerPiece, item.variant.piecesPerSet, item.quantity);
        return sum + (finalPrice * item.quantity);
    }, 0);

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold font-heading text-gray-800 flex items-center justify-center gap-2">
                        <span className="text-4xl">🧠</span> {t('stocker.title')}
                    </h1>
                    <p className="text-gray-500 max-w-2xl mx-auto mt-2">{t('stocker.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Input Panel */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
                        <h2 className="font-bold text-lg mb-6 text-gray-800 border-b border-gray-100 pb-2">Plan Requirements</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('stocker.budgetLabel')}</label>
                                <input 
                                    type="range" 
                                    min="5000" 
                                    max="100000" 
                                    step="5000" 
                                    className="w-full accent-rani-500"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                />
                                <div className="text-right font-bold text-rani-600">₹{budget.toLocaleString()}</div>
                            </div>

                            <Input 
                                label={t('stocker.locationLabel')}
                                placeholder="e.g. Surat, Gujarat"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('stocker.typeLabel')}</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 bg-white"
                                    value={customerType}
                                    onChange={(e) => setCustomerType(e.target.value)}
                                >
                                    <option>Premium Boutique</option>
                                    <option>Budget / Mass Market</option>
                                    <option>Mixed / Family Store</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Season / Occasion</label>
                                <select 
                                    className="w-full border border-gray-300 rounded px-3 py-2 outline-none focus:border-rani-500 bg-white"
                                    value={season}
                                    onChange={(e) => setSeason(e.target.value)}
                                >
                                    <option>Current Season</option>
                                    <option>Wedding / Festive</option>
                                    <option>Summer Collection</option>
                                    <option>Winter Collection</option>
                                </select>
                            </div>

                            <Button fullWidth onClick={handleGenerate} disabled={isGenerating || !location} className={isGenerating ? 'animate-pulse' : ''}>
                                {isGenerating ? t('stocker.planning') : t('stocker.generate')}
                            </Button>
                        </div>
                    </div>

                    {/* Result Panel */}
                    <div className="lg:col-span-2">
                        {!isGenerating && bundle.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p>Enter your requirements and click "Plan My Stock" to generate a bundle.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* AI Strategy Card */}
                                {strategy && (
                                    <div className="bg-purple-50 border border-purple-100 p-6 rounded-lg shadow-sm">
                                        <h3 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                                            {t('stocker.strategy')}
                                        </h3>
                                        <p className="text-purple-800 text-sm leading-relaxed">{strategy}</p>
                                    </div>
                                )}

                                {/* Bundle List */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-800">Proposed Bundle</h3>
                                        <div className="text-xs text-gray-500">{bundle.length} Items</div>
                                    </div>
                                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                                        {bundle.map((item, idx) => (
                                            <div key={idx} className="p-4 flex gap-4 hover:bg-gray-50">
                                                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0 border border-gray-200">
                                                    <img src={item.product?.images[0]} alt="" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-sm text-gray-800">{item.product?.name}</h4>
                                                        <span className="font-bold text-rani-600 text-sm">
                                                            ₹{calculatePrice(item.variant?.pricePerPiece || 0, item.variant?.piecesPerSet || 6, item.quantity).finalPrice} x {item.quantity}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        {/* Fix: size -> sizeRange */}
                                                        {item.variant?.color} / {item.variant?.sizeRange} • {item.product?.category}
                                                    </p>
                                                    <p className="text-xs text-gray-600 italic bg-gray-100 px-2 py-1 rounded inline-block">
                                                        💡 {item.reason}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-gray-600 font-medium">{t('stocker.totalValue')}</span>
                                            <span className="text-2xl font-bold text-gray-900">₹{bundleTotal.toLocaleString()}</span>
                                        </div>
                                        <Button fullWidth size="lg" onClick={handleAddAll}>
                                            {t('stocker.addToCart')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
