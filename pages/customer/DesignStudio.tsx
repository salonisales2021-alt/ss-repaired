import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { Product } from '../../types';
import { db, handleAiError } from '../../services/db';
import { KeyGate } from '../../components/KeyGate';

export const DesignStudio: React.FC = () => {
    const { products, user } = useApp();
    const { t } = useLanguage();
    
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isHighRes, setIsHighRes] = useState(false);

    const handleGenerate = async () => {
        if (!selectedProduct || !prompt) return;

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const response = await fetch(selectedProduct.images[0]);
            const blob = await response.blob();
            
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1] || '';
                if (!base64data) {
                    setIsGenerating(false);
                    return;
                }

                try {
                    // FIX: Explicitly cast env var to string to satisfy TypeScript strict checks
                    const apiKey = (process.env.API_KEY as string) || '';
                    if (!apiKey) throw new Error("API Key not found");
                    
                    const ai = new GoogleGenAI({ apiKey });
                    const modelName = isHighRes ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
                    
                    const config = isHighRes ? {
                        imageConfig: {
                            aspectRatio: "1:1",
                            imageSize: "2K"
                        }
                    } : undefined;

                    const result = await ai.models.generateContent({
                        model: modelName,
                        contents: {
                            parts: [
                                { inlineData: { mimeType: blob.type || 'image/jpeg', data: base64data } },
                                { text: `Modify this kids wear design based on these instructions: ${prompt}. Maintain the child model's features but change the dress details. High fashion photography style.` }
                            ]
                        },
                        config: config as any
                    });

                    let newImageBase64 = '';
                    if (result.candidates?.[0]?.content?.parts) {
                        for (const part of result.candidates[0].content.parts) {
                            if (part.inlineData) {
                                newImageBase64 = part.inlineData.data;
                                break;
                            }
                        }
                    }

                    if (newImageBase64) {
                        setGeneratedImage(`data:image/png;base64,${newImageBase64}`);
                    } else {
                        throw new Error("AI completed but did not return a modified image.");
                    }
                } catch (innerError: any) {
                    const handled = await handleAiError(innerError);
                    if (!handled) {
                        alert("Design AI Error: " + (innerError.message || "Failed to generate design"));
                    }
                } finally {
                    setIsGenerating(false);
                }
            };
        } catch (error: any) {
            console.error(error);
            setIsGenerating(false);
        }
    };

    const handleRequestQuote = async () => {
        if (!user || !generatedImage || !selectedProduct) return;
        setIsSubmitting(true);
        try {
            // Upload the AI design to storage first
            const res = await fetch(generatedImage);
            const blob = await res.blob();
            const file = new File([blob], `custom-design-${Date.now()}.png`, { type: 'image/png' });
            const imageUrl = await db.uploadImage(file);

            // Create a support ticket as a Request for Quote (RFQ)
            await db.createTicket({
                id: `rfq-${Date.now()}`,
                userId: user.id,
                userName: user.businessName || user.fullName,
                subject: `Custom Design RFQ: ${selectedProduct.name}`,
                category: 'OTHER',
                status: 'OPEN',
                priority: 'HIGH',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                messages: [
                    {
                        id: `m-${Date.now()}`,
                        senderId: user.id,
                        senderName: user.fullName,
                        message: `Bulk Customization Request for SKU: ${selectedProduct.sku}. Changes Requested: ${prompt}. Visualization link: ${imageUrl}`,
                        timestamp: new Date().toISOString()
                    }
                ]
            });

            alert("Your custom design request has been sent to our manufacturing team. We will contact you with a bulk price quote (Min 50 Pcs).");
            setGeneratedImage(null);
            setPrompt('');
        } catch (e) {
            alert("Failed to submit quote request. Please contact support manually.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const MainContent = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Catalog Browser */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                    <span className="text-rani-500">1.</span> {t('studio.selectProduct')}
                </h2>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {products.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => setSelectedProduct(p)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${selectedProduct?.id === p.id ? 'border-rani-500 bg-rani-50 ring-1 ring-rani-500' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                            <img src={p.images[0]} alt="" className="w-12 h-12 object-cover rounded-md" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">{p.sku}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Console */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                            <span className="text-rani-500">2.</span> {t('studio.customize')}
                        </h2>
                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">High Res Mode</span>
                            <label className="relative inline-flex items-center cursor-pointer scale-90">
                                <input type="checkbox" checked={isHighRes} onChange={e => setIsHighRes(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rani-500"></div>
                            </label>
                        </div>
                    </div>
                    
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 outline-none h-32 mb-4 bg-gray-50/50"
                        placeholder={t('studio.promptPlaceholder')}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        disabled={isGenerating}
                    />
                    
                    <Button fullWidth onClick={handleGenerate} disabled={!selectedProduct || !prompt.trim() || isGenerating} className="h-12 shadow-lg shadow-rani-500/20">
                        {isGenerating ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                {t('studio.generating')}
                            </span>
                        ) : t('studio.generate')}
                    </Button>
                </div>

                {generatedImage ? (
                    <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-200 animate-fade-in-up">
                        <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2">
                            <span className="text-rani-500">3.</span> {t('studio.result')}
                        </h2>
                        <div className="relative group rounded-lg overflow-hidden border border-gray-100 mb-6 aspect-video bg-gray-100">
                            <img src={generatedImage} alt="Customized Design" className="w-full h-full object-contain" />
                            <div className="absolute top-4 right-4 flex gap-2">
                                <button onClick={() => window.open(generatedImage, '_blank')} className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:bg-white transition-colors">👁️</button>
                            </div>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg mb-6">
                            <p className="text-xs text-orange-800 leading-relaxed italic">
                                💡 {t('studio.note')}
                            </p>
                        </div>
                        <Button fullWidth variant="secondary" onClick={handleRequestQuote} disabled={isSubmitting} className="h-14 text-lg font-black uppercase tracking-widest">
                            {isSubmitting ? 'Sending Request...' : t('studio.requestQuote')}
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 font-bold mt-3 uppercase tracking-tighter">{t('studio.minOrder')}</p>
                    </div>
                ) : selectedProduct && (
                    <div className="bg-gray-100 rounded-xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">👗</div>
                        <p className="text-sm font-bold text-gray-500">Selected: {selectedProduct.name}</p>
                        <p className="text-xs text-gray-400">Add instructions above to visualize your custom version.</p>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold font-heading text-luxury-black tracking-tight">{t('studio.title')}</h1>
                    <p className="text-gray-500 mt-2">{t('studio.subtitle')}</p>
                </div>

                {isHighRes ? (
                    <KeyGate featureName="Gemini 3 High-Res Designing">
                        {MainContent}
                    </KeyGate>
                ) : MainContent}
            </div>
        </div>
    );
};