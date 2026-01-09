
import React, { useState } from 'react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ProductCategory, ProductVariant, Product } from '../../types';
import { db, handleAiError, getGeminiKey } from '../../services/db';
import { useApp } from '../../context/AppContext';
import { GoogleGenAI } from "@google/genai";
import { KeyGate } from '../../components/KeyGate';
import { useToast } from '../../components/Toaster';

type Tab = 'Basic Info' | 'Media' | 'Variants' | 'Description';

export const ProductEditor: React.FC = () => {
    const { products, refreshProducts } = useApp();
    const { toast } = useToast();
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [activeTab, setActiveTab] = useState<Tab>('Basic Info');
    const [searchTerm, setSearchTerm] = useState('');
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState<ProductCategory>(ProductCategory.WESTERN);
    const [fabric, setFabric] = useState('');
    const [basePrice, setBasePrice] = useState<string>('');
    const [isAvailable, setIsAvailable] = useState(true);
    const [images, setImages] = useState<string[]>([]);
    const [video, setVideo] = useState<string>('');
    const [variants, setVariants] = useState<Partial<ProductVariant>[]>([{ id: `v-${Date.now()}`, sizeRange: '', color: '', pricePerPiece: 0, piecesPerSet: 6, stock: 0 }]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('Cinematic shot, 4k, fashion runway lighting, slow motion spin showing the dress details');
    const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
    const [generationProgress, setGenerationProgress] = useState('');

    const startEdit = (product: Product) => {
        setEditId(product.id); setName(product.name); setSku(product.sku); setDesc(product.description);
        setCategory(product.category); setFabric(product.fabric); setBasePrice(product.basePrice.toString());
        setIsAvailable(product.isAvailable); setImages(product.images); setVideo(product.video || '');
        
        // Auto-clubbing logic: Sort variants by Color then Size to keep them visually grouped
        const sortedVariants = [...product.variants].sort((a, b) => 
            a.color.localeCompare(b.color) || a.sizeRange.localeCompare(b.sizeRange)
        );
        
        setVariants(sortedVariants.length > 0 ? sortedVariants : [{ id: `v-${Date.now()}`, sizeRange: '', color: '', pricePerPiece: Number(product.basePrice), piecesPerSet: 6, stock: 0 }]);
        setView('FORM');
    };

    const startCreate = () => {
        setEditId(null); setName(''); setSku(''); setDesc(''); setCategory(ProductCategory.WESTERN);
        setFabric(''); setBasePrice(''); setIsAvailable(true); setImages([]); setVideo('');
        setVariants([{ id: `v-${Date.now()}`, sizeRange: '', color: '', pricePerPiece: 0, piecesPerSet: 6, stock: 0 }]);
        setView('FORM');
    };

    const generateDescription = async () => {
        if (!name || !category || !fabric) { toast("Provide Name, Category, and Fabric first.", "warning"); return; }
        setLoading(true);
        try {
            const apiKey = getGeminiKey();
            if (!apiKey) throw new Error("API Key missing. Please configure it in Admin Settings.");

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Write a high-end B2B fashion description for: ${name}, Category: ${category}, Fabric: ${fabric}. Focus on quality and wholesale appeal.`,
            });
            if (response.text) setDesc(response.text.trim());
            toast("Description generated!", "success");
        } catch (e: any) {
            await handleAiError(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAiVideo = async () => {
        if (images.length === 0) { toast("Please upload an image first.", "warning"); return; }
        setIsGeneratingVideo(true);
        setGenerationProgress('Waking up AI model...');
        try {
            const imageResponse = await fetch(images[0]);
            const imageBlob = await imageResponse.blob();
            const base64data = await new Promise<string>((resolve) => {
                const reader = new FileReader(); reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || ""); reader.readAsDataURL(imageBlob);
            });
            
            const apiKey = getGeminiKey();
            if (!apiKey) throw new Error("API Key missing. Please configure it in Admin Settings.");

            const ai = new GoogleGenAI({ apiKey });
            let operation = await ai.models.generateVideos({
                model: 'veo-3.1-fast-generate-preview',
                prompt: aiPrompt,
                image: { imageBytes: base64data, mimeType: imageBlob.type || 'image/jpeg' },
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            });

            while (!operation.done) {
                setGenerationProgress('AI is rendering runway video...');
                await new Promise(r => setTimeout(r, 10000));
                operation = await ai.operations.getVideosOperation({ operation });
            }

            if (operation.response?.generatedVideos?.[0]?.video?.uri) {
                const downloadLink = operation.response.generatedVideos[0].video.uri;
                // Use the valid apiKey variable here instead of accessing process.env directly again
                const videoRes = await fetch(`${downloadLink}&key=${apiKey}`);
                const videoBlob = await videoRes.blob();
                const url = await db.uploadVideo(videoBlob);
                setVideo(url);
                toast("AI Video linked successfully!", "success");
            }
        } catch (error: any) {
            const handled = await handleAiError(error);
            if (!handled) toast(`Generation failed: ${error.message}`, "error");
        } finally {
            setIsGeneratingVideo(false); setGenerationProgress('');
        }
    };

    const handleSave = async () => {
        if (!name || !sku || !basePrice) { toast("Fill in required fields.", "warning"); return; }
        setLoading(true);
        try {
            // Auto-club variants before saving
            // Sort by Color then by Size Range to keep them visually grouped in the database
            const sortedVariants = [...variants].sort((a, b) => 
                (a.color || '').localeCompare(b.color || '') || 
                (a.sizeRange || '').localeCompare(b.sizeRange || '')
            );

            await db.saveProduct({ 
                id: editId || undefined, name, sku, description: desc, category, fabric, 
                basePrice: Number(basePrice), images, video, 
                variants: sortedVariants as ProductVariant[], isAvailable 
            });
            toast("Product catalog updated.", "success"); 
            refreshProducts(); 
            setView('LIST');
        } catch (error) { toast("Error saving to database.", "error"); } finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this product?")) return;
        setLoading(true);
        try {
            const success = await db.deleteProduct(id);
            if (success) {
                toast("Product deleted successfully", "success");
                refreshProducts();
            } else {
                toast("Failed to delete product", "error");
            }
        } catch (e) {
            toast("Error deleting product", "error");
        } finally {
            setLoading(false);
        }
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setVariants(newVariants);
    };

    const addVariant = () => {
        setVariants([...variants, { id: `v-${Date.now()}`, sizeRange: '', color: '', pricePerPiece: Number(basePrice), piecesPerSet: 6, stock: 0 }]);
    };

    const removeVariant = (index: number) => {
        if (variants.length <= 1) {
            toast("At least one variant is required.", "warning");
            return;
        }
        setVariants(variants.filter((_, i) => i !== index));
    };

    const duplicateVariant = (index: number) => {
        const source = variants[index];
        const newVar = { ...source, id: `v-${Date.now()}` };
        const newVariants = [...variants];
        newVariants.splice(index + 1, 0, newVar);
        setVariants(newVariants);
        toast("Variant duplicated. Update details as needed.", "info");
    };

    if (view === 'LIST') {
        const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="animate-fade-in max-w-6xl mx-auto p-6">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Catalog Management</h1>
                        <p className="text-sm text-gray-500">Manage products, variants and AI assets.</p>
                    </div>
                    <Button onClick={startCreate}>+ Add New Dress</Button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <input type="text" placeholder="Filter by Name or SKU..." className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-rani-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                            <tr><th className="p-5">Visual</th><th className="p-5">Product Details</th><th className="p-5">Wholesale Rate</th><th className="p-5 text-right">Control</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">{filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="p-5"><img src={p.images[0]} className="w-12 h-16 object-cover rounded shadow-sm group-hover:scale-105 transition-transform" /></td>
                                <td className="p-5">
                                    <strong className="text-gray-800 text-base">{p.name}</strong>
                                    <div className="text-[10px] font-black text-gray-400 font-mono tracking-tighter uppercase">{p.sku} • {p.category}</div>
                                </td>
                                <td className="p-5 font-black text-luxury-black">₹{p.basePrice.toLocaleString()}</td>
                                <td className="p-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Manage / Rectify</Button>
                                        <Button size="sm" variant="text" className="text-red-500 hover:bg-red-50 px-3" onClick={() => handleDelete(p.id)} title="Delete Product">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl border border-gray-100 animate-fade-in flex flex-col h-[calc(100vh-140px)] overflow-hidden m-6 ring-1 ring-black/5">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rani-500 rounded-xl flex items-center justify-center text-white text-lg font-script font-bold shadow-md">S</div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 leading-tight">{editId ? 'Rectify Details' : 'New Collection Entry'}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{editId ? `Editing SKU: ${sku}` : 'Inventory Onboarding'}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setView('LIST')}>Discard</Button>
                    <Button onClick={handleSave} disabled={loading || uploading || isGeneratingVideo} className="px-10 shadow-lg shadow-rani-500/10">Save & Publish</Button>
                </div>
            </div>

            <div className="flex border-b border-gray-100 bg-white shrink-0">
                {(['Basic Info', 'Media', 'Variants', 'Description'] as Tab[]).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === tab ? 'border-rani-500 text-rani-600 bg-rani-50/30' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>{tab}</button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {activeTab === 'Basic Info' && (
                    <div className="space-y-8 max-w-2xl animate-fade-in">
                        <Input label="Display Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Royal Silk Anarkali" />
                        <div className="grid grid-cols-2 gap-8">
                            <Input label="Product SKU" value={sku} onChange={e => setSku(e.target.value)} placeholder="SS-ETH-001" />
                            <Input label="Base Wholesale Price (₹)" type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Fabric Specification</label>
                                <input className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-rani-500" value={fabric} onChange={e => setFabric(e.target.value)} placeholder="e.g. 100% Pure Cotton" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Status</label>
                                <select className="w-full border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-rani-500 bg-white" value={isAvailable ? 'YES' : 'NO'} onChange={e => setIsAvailable(e.target.value === 'YES')}>
                                    <option value="YES">LIVE / IN STOCK</option>
                                    <option value="NO">HIDDEN / DISCONTINUED</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Media' && (
                    <div className="space-y-12 animate-fade-in">
                        <section>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                <span className="text-lg">📸</span> Design Gallery
                            </h3>
                            <div className="grid grid-cols-5 gap-4">
                                {images.map((img, i) => (
                                    <div key={i} className="relative aspect-[3/4] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden group shadow-sm ring-1 ring-black/5">
                                        <img src={img} className="w-full h-full object-cover" alt="" />
                                        <button onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                                    </div>
                                ))}
                                <label className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-rani-500 transition-all aspect-[3/4] gap-2">
                                    <span className="text-2xl text-gray-300">+</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Photo</span>
                                    <input type="file" className="hidden" onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            setUploading(true);
                                            try { const url = await db.uploadImage(e.target.files[0]); setImages([...images, url]); } 
                                            catch (err) { toast("Upload failed.", "error"); } finally { setUploading(false); }
                                        }
                                    }} />
                                </label>
                            </div>
                        </section>

                        <section className="bg-gradient-to-br from-purple-50 to-rani-50/30 p-8 rounded-3xl border border-purple-100 shadow-inner">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="font-bold text-lg text-purple-900 flex items-center gap-2">
                                        ✨ AI Video Generator <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black">VEO 3.1</span>
                                    </h3>
                                    <p className="text-xs text-purple-700/70 mt-1">Generate a high-end cinematic runway walk for this dress.</p>
                                </div>
                            </div>
                            
                            <KeyGate featureName="Veo AI Video Engine">
                                <div className="space-y-4">
                                    <textarea className="w-full border border-purple-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none h-24 bg-white/50" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                                    <div className="flex items-center gap-6">
                                        <Button onClick={handleGenerateAiVideo} disabled={isGeneratingVideo || images.length === 0} className="bg-purple-600 hover:bg-purple-700 px-8 shadow-xl shadow-purple-200">
                                            {isGeneratingVideo ? generationProgress : '🎬 Generate Runway Clip'}
                                        </Button>
                                        {video && <div className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">✅ Clip Ready <button onClick={() => setVideo('')} className="text-gray-400 hover:text-red-500 ml-2">Remove</button></div>}
                                    </div>
                                    {video && (
                                        <div className="mt-4 rounded-2xl overflow-hidden border border-purple-200 shadow-2xl max-w-sm ring-4 ring-white">
                                            <video src={video} controls className="w-full" />
                                        </div>
                                    )}
                                </div>
                            </KeyGate>
                        </section>
                    </div>
                )}

                {activeTab === 'Variants' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 mb-6">
                            <span className="text-xl">💡</span>
                            <div className="text-xs text-orange-800 leading-relaxed">
                                <p className="font-bold">Rectify & Manage Variants</p>
                                Edit sizes, colors, and prices directly here. Use the "Copy" button to quickly duplicate a row (useful for adding same size in different color).
                            </div>
                        </div>
                        
                        <div className="grid gap-4">
                            {variants.map((v, i) => (
                                <div key={v.id} className="grid grid-cols-12 gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm items-end relative group transition-all hover:shadow-md hover:border-rani-200">
                                    <div className="col-span-3">
                                        <Input label="Color / Desc" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} placeholder="Pink Floral" className="h-10 text-sm" />
                                    </div>
                                    <div className="col-span-3">
                                        <Input label="Size Range" value={v.sizeRange} onChange={e => updateVariant(i, 'sizeRange', e.target.value)} placeholder="24-34" className="h-10 text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <Input label="Price/Pc" type="number" value={v.pricePerPiece} onChange={e => updateVariant(i, 'pricePerPiece', Number(e.target.value))} className="h-10 text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <Input label="Stock (Sets)" type="number" value={v.stock} onChange={e => updateVariant(i, 'stock', Number(e.target.value))} className="h-10 text-sm" />
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="col-span-2 flex justify-end gap-2 pb-1">
                                        <button 
                                            onClick={() => duplicateVariant(i)} 
                                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                            title="Duplicate Row"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => removeVariant(i)} 
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Delete Variant"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" fullWidth onClick={addVariant}>+ Add Empty Variant Row</Button>
                    </div>
                )}

                {activeTab === 'Description' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Marketing Description</h3>
                            <Button size="sm" variant="outline" onClick={generateDescription}>✨ Rewrite with AI</Button>
                        </div>
                        <textarea className="w-full border border-gray-200 rounded-3xl p-8 text-sm h-96 focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 outline-none leading-relaxed bg-gray-50/30" value={desc} onChange={e => setDesc(e.target.value)} />
                    </div>
                )}
            </div>
        </div>
    );
};
