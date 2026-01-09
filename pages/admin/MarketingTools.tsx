
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { db } from '../../services/db';

export const MarketingTools: React.FC = () => {
    const { products, setHeroVideo } = useApp();
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [promptModifier, setPromptModifier] = useState('Cinematic fashion runway');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const handleGenerateVideo = async () => {
        if (!selectedProduct) return;
        setIsGenerating(true);
        try {
            // Using backend AI service to generate content
            const prompt = `Generate a video prompt description for: ${selectedProduct.name}, Fabric: ${selectedProduct.fabric}. Context: ${promptModifier}`;
            const description = await db.ai.generateContent(prompt);
            
            // In a real scenario, this would call a video generation API via Edge Function.
            // Since we can't spin up a GPU cluster here, we'll simulate the "response" logic 
            // by using the text generation to confirm the system is working via backend.
            alert(`AI Request Sent via Edge Function.\nPrompt generated: ${description}\n(Video generation would proceed on backend queue)`);
            
        } catch (error: any) {
            alert("AI Service Error: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto p-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">AI Marketing Studio</h1>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="space-y-6">
                    <select 
                        className="w-full border border-gray-300 rounded-lg px-4 py-3"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                        <option value="">-- Choose Product --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    
                    <textarea 
                        className="w-full border border-gray-200 rounded-xl p-4 text-sm"
                        placeholder="Video style description..."
                        value={promptModifier}
                        onChange={(e) => setPromptModifier(e.target.value)}
                    />

                    <Button fullWidth onClick={handleGenerateVideo} disabled={!selectedProductId || isGenerating}>
                        {isGenerating ? 'Processing on Server...' : 'Generate Asset'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
