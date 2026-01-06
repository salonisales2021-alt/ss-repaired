
import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { db, handleAiError, parseAIJson } from '../../services/db';
import { Product, ProductCategory } from '../../types';

interface DraftProduct {
    id: string;
    image: string;
    name: string;
    category: ProductCategory;
    fabric: string;
    suggestedPrice: number;
    sku: string;
    status: 'draft' | 'saving' | 'saved';
}

export const BulkOnboarding: React.FC = () => {
    const { refreshProducts } = useApp();
    const { t } = useLanguage();
    
    const [drafts, setDrafts] = useState<DraftProduct[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        setIsAnalyzing(true);
        const newDrafts: DraftProduct[] = [];

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            for (const file of files) {
                try {
                    const reader = new FileReader();
                    const filePromise = new Promise<string>((resolve) => {
                        reader.onload = () => resolve(reader.result as string);
                        reader.readAsDataURL(file);
                    });

                    const base64 = await filePromise;
                    const base64Data = base64.split(',')[1];

                    const response: GenerateContentResponse = await ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: {
                            parts: [
                                { inlineData: { data: base64Data, mimeType: file.type } },
                                { text: "Analyze fashion product. Extract: Name, Category (Western Wear, Ethnic Wear, or Indo-Western Wear), Fabric, Wholesale Price (INR). Return JSON only." }
                            ]
                        },
                        config: {
                            responseMimeType: "application/json",
                            responseSchema: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ["Western Wear", "Ethnic Wear", "Indo-Western Wear"] },
                                    fabric: { type: Type.STRING },
                                    suggestedPrice: { type: Type.NUMBER }
                                },
                                required: ["name", "category", "fabric", "suggestedPrice"]
                            }
                        }
                    });

                    const analysis = parseAIJson(response.text, {}) as any;
                    
                    newDrafts.push({
                        id: Math.random().toString(36).substr(2, 9),
                        image: base64,
                        name: analysis.name || "Untitled Product",
                        category: (analysis.category as ProductCategory) || ProductCategory.WESTERN,
                        fabric: analysis.fabric || "Premium Cotton",
                        suggestedPrice: analysis.suggestedPrice || 0,
                        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
                        status: 'draft'
                    });
                } catch (innerErr) {
                    await handleAiError(innerErr);
                }
            }

            setDrafts(prev => [...prev, ...newDrafts]);
        } catch (error) {
            await handleAiError(error);
        } finally {
            setIsAnalyzing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSaveDraft = async (draft: DraftProduct) => {
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'saving' } : d));
        
        try {
            const response = await fetch(draft.image);
            const blob = await response.blob();
            // Determine file extension from MIME type or default to jpg
            const ext = blob.type.split('/')[1] || 'jpg';
            
            // User requested 'webAssets' bucket for bulk onboarding images
            const imageUrl = await db.uploadImage(
                new File([blob], `${draft.sku}.${ext}`, { type: blob.type }),
                'webAssets'
            );

            const productData: Partial<Product> = {
                name: draft.name, sku: draft.sku, category: draft.category,
                fabric: draft.fabric, basePrice: draft.suggestedPrice, images: [imageUrl],
                isAvailable: true, 
                // Fix: size -> sizeRange, price -> pricePerPiece, added piecesPerSet
                variants: [{ id: `v-${Date.now()}`, sizeRange: 'Free Size', color: 'As Shown', stock: 10, pricePerPiece: draft.suggestedPrice, piecesPerSet: 1 }],
                description: `New Arrival: ${draft.name}. Premium ${draft.fabric} material.`
            };

            const success = await db.saveProduct(productData);
            setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: success ? 'saved' : 'draft' } : d));
        } catch (e) {
            setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'draft' } : d));
        }
    };

    const handleSaveAll = async () => {
        const pending = drafts.filter(d => d.status === 'draft');
        for (const d of pending) { await handleSaveDraft(d); }
        refreshProducts();
    };

    return (
        <div className="animate-fade-in p-6">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('bulk.title')}</h1>
                    <p className="text-sm text-gray-500">{t('bulk.subtitle')}</p>
                </div>
                {drafts.length > 0 && <Button onClick={handleSaveAll}>{t('bulk.saveAll')}</Button>}
            </div>

            <div 
                className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-rani-500 transition-all cursor-pointer mb-8"
                onClick={() => fileInputRef.current?.click()}
            >
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👗</div>
                <h3 className="text-lg font-bold text-gray-700">{t('bulk.dropzone')}</h3>
                {isAnalyzing && <p className="mt-4 text-rani-600 font-bold animate-pulse">{t('bulk.analyzing')}</p>}
            </div>

            {drafts.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-700">{t('bulk.draftTable')}</h3>
                        <button onClick={() => setDrafts([])} className="text-xs text-red-500 font-bold hover:underline">Discard All</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Photo</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4 text-right">Price (₹)</th>
                                    <th className="p-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {drafts.map((d) => (
                                    <tr key={d.id} className={d.status === 'saved' ? 'bg-green-50' : ''}>
                                        <td className="p-4"><img src={d.image} className="w-12 h-16 object-cover rounded" alt="" /></td>
                                        <td className="p-4 font-mono text-xs">{d.sku}</td>
                                        <td className="p-4 font-bold">{d.name}</td>
                                        <td className="p-4 text-right">₹{d.suggestedPrice}</td>
                                        <td className="p-4 text-right">
                                            {d.status === 'saved' ? <span className="text-green-600 font-bold">SAVED</span> : <Button size="sm" onClick={() => handleSaveDraft(d)} disabled={d.status === 'saving'}>{d.status === 'saving' ? '...' : 'Import'}</Button>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
