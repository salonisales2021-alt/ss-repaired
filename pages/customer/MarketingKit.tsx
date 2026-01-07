
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { GoogleGenAI, Type } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { parseAIJson } from '../../services/db';

interface MarketingItem {
    productId: string;
    productName: string;
    basePrice: number;
    image: string;
    generatedContent?: {
        retailPrice: number;
        instagramCaption: string;
        whatsappMessage: string;
        title: string;
    };
}

export const MarketingKit: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useApp();
    const { t } = useLanguage();
    
    // Config State
    const [margin, setMargin] = useState(50); // Default 50%
    const [tone, setTone] = useState('Fun & Playful');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Items State
    const [items, setItems] = useState<MarketingItem[]>([]);

    useEffect(() => {
        // Load items passed from OrderHistory
        if (location.state && location.state.items) {
            const initialItems = location.state.items.map((i: any) => ({
                productId: i.productId,
                productName: i.productName,
                basePrice: i.price,
                image: i.image
            }));
            setItems(initialItems);
        } else {
            // Redirect if no items
            navigate('/orders');
        }
    }, [location.state, navigate]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                You are a social media marketing expert for a kids' clothing boutique. 
                Generate marketing copy for the following products to be sold to end consumers (parents).
                
                Input Data: ${JSON.stringify(items.map(i => ({ name: i.productName, price: i.basePrice })))}
                
                Parameters:
                - Target Audience: Parents of young girls.
                - Tone: ${tone}.
                - Profit Margin to apply: ${margin}%. (Calculate Retail Price = Base Price + (Base Price * ${margin}/100)).
                - Currency: ₹ (INR).
                
                Output JSON Array format:
                [{
                    "productId": "...", // matching input
                    "retailPrice": 1234, // number
                    "title": "Catchy B2C Title",
                    "instagramCaption": "Caption with emojis and hashtags",
                    "whatsappMessage": "Short, direct message for WhatsApp status or groups"
                }]
            `;

            const responseSchema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productId: { type: Type.STRING },
                        retailPrice: { type: Type.NUMBER },
                        title: { type: Type.STRING },
                        instagramCaption: { type: Type.STRING },
                        whatsappMessage: { type: Type.STRING }
                    },
                    required: ["retailPrice", "title", "instagramCaption", "whatsappMessage"]
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });

            const generatedData = parseAIJson<any[]>(response.text, []);
            
            // Merge generated data with items
            setItems(prevItems => prevItems.map(item => {
                const gen = generatedData.find((g: any) => g.productId === item.productName || generatedData.indexOf(g) === prevItems.indexOf(item)); // Fallback to index if name match fails (simple logic)
                return {
                    ...item,
                    generatedContent: gen ? {
                        retailPrice: gen.retailPrice,
                        instagramCaption: gen.instagramCaption,
                        whatsappMessage: gen.whatsappMessage,
                        title: gen.title
                    } : undefined
                };
            }));

        } catch (error) {
            console.error(error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold font-heading text-gray-800">{t('marketing.title')}</h1>
                    <p className="text-gray-500">{t('marketing.subtitle')}</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Config Panel */}
                    <div className="w-full lg:w-1/3 bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit sticky top-24">
                        <h2 className="font-bold text-lg mb-6">{t('marketing.config')}</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {t('marketing.profitMargin')}
                                </label>
                                <div className="flex items-center gap-4">
                                    <input 
                                        type="range" 
                                        min="10" 
                                        max="200" 
                                        value={margin} 
                                        onChange={(e) => setMargin(Number(e.target.value))}
                                        className="w-full accent-rani-500"
                                    />
                                    <span className="font-bold text-rani-600 w-12">{margin}%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Example: ₹1000 + {margin}% = ₹{1000 + (1000 * margin / 100)}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    {t('marketing.tone')}
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {['Luxury & Elegant', 'Fun & Playful', 'Sale / Urgent'].map(tOption => (
                                        <label key={tOption} className={`flex items-center gap-2 border p-3 rounded cursor-pointer transition-colors ${tone === tOption ? 'bg-rani-50 border-rani-500 text-rani-700' : 'hover:bg-gray-50'}`}>
                                            <input 
                                                type="radio" 
                                                name="tone" 
                                                className="accent-rani-500"
                                                checked={tone === tOption}
                                                onChange={() => setTone(tOption)}
                                            />
                                            <span className="text-sm font-medium">{tOption}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button fullWidth onClick={handleGenerate} disabled={isGenerating} className={isGenerating ? 'animate-pulse' : ''}>
                                {isGenerating ? t('marketing.generating') : t('marketing.generate')}
                            </Button>
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 space-y-6">
                        {items.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                                <div className="w-full md:w-48 h-48 md:h-auto bg-gray-100 shrink-0">
                                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                                </div>
                                
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">
                                                {item.generatedContent ? item.generatedContent.title : item.productName}
                                            </h3>
                                            <div className="flex gap-4 text-xs mt-1">
                                                <span className="text-gray-500">Buy: ₹{item.basePrice}</span>
                                                <span className="text-green-600 font-bold bg-green-50 px-2 rounded">
                                                    Sell: ₹{item.generatedContent ? item.generatedContent.retailPrice : Math.round(item.basePrice * (1 + margin/100))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {item.generatedContent ? (
                                        <div className="space-y-4 mt-2">
                                            <div className="bg-gray-50 p-3 rounded border border-gray-100 relative group">
                                                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Instagram Caption</div>
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.generatedContent.instagramCaption}</p>
                                                <button 
                                                    onClick={() => copyToClipboard(item.generatedContent!.instagramCaption)}
                                                    className="absolute top-2 right-2 bg-white border border-gray-200 p-1.5 rounded hover:text-rani-600 text-gray-400"
                                                    title="Copy"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                            
                                            <div className="bg-green-50 p-3 rounded border border-green-100 relative group">
                                                <div className="text-xs font-bold text-green-700 uppercase mb-1">WhatsApp Message</div>
                                                <p className="text-sm text-gray-700">{item.generatedContent.whatsappMessage}</p>
                                                <button 
                                                    onClick={() => copyToClipboard(item.generatedContent!.whatsappMessage)}
                                                    className="absolute top-2 right-2 bg-white border border-gray-200 p-1.5 rounded hover:text-green-600 text-gray-400"
                                                    title="Copy"
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded mt-2 border border-dashed border-gray-200">
                                            Click "Generate Assets" to create content.
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
