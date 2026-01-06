
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import { db, parseAIJson } from '../../services/db';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { UserRole } from '../../types';
import { Button } from '../../components/Button';

// Widget for AI Predictions
const RestockRecommender: React.FC = () => {
    const { products } = useApp();
    const { t } = useLanguage();
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        analyzeShortages();
    }, [products]);

    const analyzeShortages = async () => {
        if (products.length === 0) return;
        
        setLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const inventoryContext = products.map(p => ({
                id: p.id,
                name: p.name,
                totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
                avgWeeklySales: Math.floor(Math.random() * 20) + 5 
            }));

            const prompt = `Analyze this inventory. Predict which top 3 items will run out of stock in the next 30 days based on weekly sales. 
            Context: ${JSON.stringify(inventoryContext)}
            Return JSON only: { "items": [{ "productId": "...", "reason": "...", "recommendedQty": 123 }] }`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });

            const res = parseAIJson(response.text, { items: [] } as any);
            if (res.items) {
                const hydrated = res.items.map((item: any) => ({
                    ...item,
                    product: products.find(p => p.id === item.productId)
                })).filter((i: any) => i.product);
                setRecommendations(hydrated);
            }
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-xl">📊</span> {t('admin.restockTitle')}
                    </h3>
                    <p className="text-xs text-gray-400">{t('admin.restockSubtitle')}</p>
                </div>
                <button onClick={analyzeShortages} className="text-rani-600 hover:bg-rani-50 p-2 rounded-full transition-colors">
                    <svg className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357