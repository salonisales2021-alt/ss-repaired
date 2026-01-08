
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { GoogleGenAI } from "@google/genai";
import { db, handleAiError, getGeminiKey } from '../../services/db';
import { KeyGate } from '../../components/KeyGate';

export const MarketingTools: React.FC = () => {
    const { products, setHeroVideo } = useApp();
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [promptModifier, setPromptModifier] = useState('A confident 7-year-old Indian girl walking on a luxury fashion runway, cinematic lighting, 4k, photorealistic');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState('');

    const selectedProduct = products.find(p => p.id === selectedProductId);

    const handleGenerateVideo = async () => {
        if (!selectedProduct) return;

        setIsGenerating(true);
        setGeneratedVideoUrl(null);
        setProgress('Preparing high-quality fashion assets...');

        try {
            const imageUrl = selectedProduct.images[0];
            const imageResponse = await fetch(imageUrl);
            const imageBlob = await imageResponse.blob();
            
            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            
            reader.onloadend = async () => {
                const base64data = reader.result?.toString().split(',')[1];
                if (!base64data) {
                    setIsGenerating(false);
                    return;
                }

                try {
                    setProgress('Initializing AI Video Engine (Veo)...');
                    // Ensure key exists
                    const apiKey = getGeminiKey();
                    if (!apiKey) {
                        throw new Error("API Key is missing. Please select a key via the AI Studio button or configure env vars.");
                    }
                    const ai = new GoogleGenAI({ apiKey });
                    const fullPrompt = `${promptModifier}. Character is wearing: ${selectedProduct.name}. Fabric texture: ${selectedProduct.fabric}. Focus on fluid dress movement.`;

                    setProgress('Generating Video (this may take up to 2 minutes)...');
                    let operation = await ai.models.generateVideos({
                        model: 'veo-3.1-fast-generate-preview',
                        prompt: fullPrompt,
                        image: {
                            imageBytes: base64data,
                            mimeType: imageBlob.type || 'image/jpeg',
                        },
                        config: {
                            numberOfVideos: 1,
                            resolution: '720p',
                            aspectRatio: '16:9'
                        }
                    });

                    while (!operation.done) {
                        setProgress('AI is dreaming up the fashion show...');
                        await new Promise(resolve => setTimeout(resolve, 10000)); 
                        operation = await ai.operations.getVideosOperation({ operation: operation });
                    }

                    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                        const downloadLink = operation.response.generatedVideos[0].video.uri;
                        setGeneratedVideoUrl(`${downloadLink}&key=${apiKey}`);
                        setProgress('Video generation complete!');
                    } else {
                        throw new Error("Generation finished but no video URI was returned.");
                    }
                } catch (innerError: any) {
                    const handled = await handleAiError(innerError);
                    if (!handled) {
                        alert("AI Studio Error: " + (innerError.message || "Failed to generate video"));
                    }
                    setProgress('');
                } finally {
                    setIsGenerating(false);
                }
            };

        } catch (error: any) {
            console.error(error);
            setProgress(`Critical error: ${error.message || 'Generation failed'}`);
            setIsGenerating(false);
        }
    };

    const applyToHomepage = () => {
        if (generatedVideoUrl) {
            setHeroVideo(generatedVideoUrl);
            alert("Success: Homepage Hero Banner has been updated with the AI runway feed.");
        }
    };

    const saveToProduct = async () => {
        if (!selectedProduct || !generatedVideoUrl) return;
        try {
            setProgress('Saving video to cloud storage...');
            const response = await fetch(generatedVideoUrl);
            const blob = await response.blob();
            const publicUrl = await db.uploadVideo(blob);
            await db.saveProduct({ ...selectedProduct, video: publicUrl });
            alert("Video successfully linked to product catalog.");
        } catch (e) {
            alert("Failed to save the generated video to the database.");
        } finally {
            setProgress('');
        }
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">AI Marketing Studio</h1>
                <p className="text-sm text-gray-500 font-medium">Generate cinematic runway videos for your catalog using Gemini Veo technology.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-700">
                        <span className="text-rani-500">🎬</span> Production Suite
                    </h2>
                    
                    <KeyGate featureName="AI Video Generation">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Select Dress Design</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-rani-500 bg-white shadow-sm"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    disabled={isGenerating}
                                >
                                    <option value="">-- Choose from Catalog --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Directorial Prompt</label>
                                <textarea 
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-rani-500 text-sm h-32"
                                    placeholder="e.g. A fashion walk on a rain-soaked futuristic street with neon lights..."
                                    value={promptModifier}
                                    onChange={(e) => setPromptModifier(e.target.value)}
                                    disabled={isGenerating}
                                />
                            </div>

                            <Button 
                                fullWidth 
                                onClick={handleGenerateVideo} 
                                disabled={!selectedProductId || isGenerating}
                                className="h-14 font-bold text-lg shadow-lg"
                            >
                                {isGenerating ? 'Processing...' : '🎬 Generate Runway Video'}
                            </Button>
                            
                            {isGenerating && (
                                <div className="mt-4 p-4 bg-rani-50 rounded-lg border border-rani-100 animate-pulse text-center">
                                    <p className="text-xs text-rani-600 font-bold">{progress}</p>
                                </div>
                            )}
                        </div>
                    </KeyGate>
                </div>

                <div className="bg-luxury-black rounded-2xl shadow-2xl p-8 flex flex-col items-center justify-center min-h-[450px] text-white relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rani-900/20 to-transparent"></div>
                    
                    {generatedVideoUrl ? (
                        <div className="w-full space-y-6 animate-fade-in relative z-10">
                            <video 
                                src={generatedVideoUrl} 
                                controls 
                                autoPlay 
                                loop 
                                className="w-full aspect-video rounded-xl bg-black shadow-2xl ring-1 ring-white/10" 
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Button fullWidth onClick={applyToHomepage} variant="primary">Use as Banner</Button>
                                <Button 
                                    fullWidth 
                                    onClick={saveToProduct} 
                                    variant="outline" 
                                    className="text-white border-white/20 hover:bg-white/10"
                                >
                                    Save to SKU
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 opacity-40 group-hover:opacity-60 transition-opacity">
                            <div className="text-6xl">📽️</div>
                            <p className="text-sm italic font-medium">AI video preview will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
