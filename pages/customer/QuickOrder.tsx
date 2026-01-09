
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { ProductVariant, Product } from '../../types';
import { GoogleGenAI, Type } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';
import { handleAiError, parseAIJson } from '../../services/db';

export const QuickOrder: React.FC = () => {
    const { products, addToCart } = useApp();
    const { t } = useLanguage();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<'MANUAL' | 'SMART_PASTE' | 'CSV'>('MANUAL');
    const [searchTerm, setSearchTerm] = useState('');
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [pasteText, setPasteText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const csvInputRef = useRef<HTMLInputElement>(null);

    const allVariants = useMemo(() => {
        if (!products) return [];
        return products.flatMap(p => 
            (p.variants || []).map(v => ({
                product: p,
                variant: v,
                searchString: `${p.name} ${p.sku} ${v.color || ''} ${v.sizeRange || ''}`.toLowerCase()
            }))
        );
    }, [products]);

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return allVariants;
        return allVariants.filter(item => item.searchString.includes(term));
    }, [allVariants, searchTerm]);

    const handleQuantityChange = (variantId: string, val: string) => {
        const qty = Math.max(0, parseInt(val) || 0);
        setQuantities(prev => ({
            ...prev,
            [variantId]: qty
        }));
    };

    const handleAddToCart = () => {
        let addedCount = 0;
        Object.entries(quantities).forEach(([variantId, q]) => {
            const qty = q as number;
            if (qty > 0) {
                const item = allVariants.find(i => i.variant.id === variantId);
                if (item) {
                    addToCart(item.product, item.variant, qty);
                    addedCount++;
                }
            }
        });
        
        if (addedCount > 0) {
            alert(`Order successful: Added ${addedCount} line items to your cart.`);
            setQuantities({});
            navigate('/cart');
        } else {
            alert("Please enter quantities for the items you wish to order.");
        }
    };

    // --- CSV LOGIC ---
    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,SKU,Quantity_Sets\nSS-ETH-001,5\nWD-001-PINK,10";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "saloni_order_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            processCsvData(text);
        };
        reader.readAsText(file);
        // Reset input
        if (csvInputRef.current) csvInputRef.current.value = '';
    };

    const processCsvData = (text: string) => {
        const lines = text.split(/\r\n|\n/);
        const newQuantities = { ...quantities };
        let matchCount = 0;
        let failCount = 0;

        // Skip header if present (simple check if first char is not number)
        const startIdx = isNaN(Number(lines[0].split(',')[1])) ? 1 : 0;

        for (let i = startIdx; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [key, qtyStr] = line.split(',');
            const qty = parseInt(qtyStr);

            if (key && !isNaN(qty) && qty > 0) {
                const searchKey = key.toLowerCase().trim();
                // Exact SKU match first, then name search
                const match = allVariants.find(v => 
                    v.product.sku.toLowerCase() === searchKey || 
                    v.searchString.includes(searchKey)
                );

                if (match) {
                    newQuantities[match.variant.id] = (newQuantities[match.variant.id] || 0) + qty;
                    matchCount++;
                } else {
                    failCount++;
                }
            }
        }

        setQuantities(newQuantities);
        alert(`CSV Processed: ${matchCount} items matched. ${failCount > 0 ? `${failCount} items not found.` : ''}`);
        setActiveTab('MANUAL'); // Switch to manual view to see results
    };

    // --- AI LOGIC ---
    const handleParseAI = async () => {
        if (!pasteText.trim()) return;
        setIsParsing(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Analyze this raw text and extract B2B fashion order details (SKU/name, color, size, and quantity in sets). Text: "${pasteText}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                keyword: { type: Type.STRING, description: "Product name or SKU snippet" },
                                color: { type: Type.STRING },
                                size: { type: Type.STRING },
                                quantitySets: { type: Type.NUMBER }
                            },
                            required: ["keyword", "quantitySets"]
                        }
                    }
                }
            });

            const parsedItems = parseAIJson(response.text || '', []);
            const newQuantities = { ...quantities };
            let matchedCount = 0;

            parsedItems.forEach((item: any) => {
                const bestMatch = allVariants.find(v => {
                    const vStr = v.searchString;
                    return vStr.includes((item.keyword || '').toLowerCase()) &&
                           (!item.color || vStr.includes(item.color.toLowerCase())) &&
                           (!item.size || vStr.includes(item.size.toLowerCase()));
                });

                if (bestMatch && item.quantitySets > 0) {
                    newQuantities[bestMatch.variant.id] = (newQuantities[bestMatch.variant.id] || 0) + item.quantitySets;
                    matchedCount++;
                }
            });

            setQuantities(newQuantities);
            alert(`AI Match: Identified ${matchedCount} product sets from your text.`);
            setActiveTab('MANUAL');
            setPasteText('');

        } catch (error: any) {
            const handled = await handleAiError(error);
            if (!handled) alert("AI Parsing Error. Please check your text format.");
        } finally {
            setIsParsing(false);
        }
    };

    const pendingTotal = useMemo(() => {
        return Object.entries(quantities).reduce((sum, [vid, q]) => {
            const qty = q as number;
            const item = allVariants.find(i => i.variant.id === vid);
            return sum + (item ? (item.variant.pricePerPiece * item.variant.piecesPerSet) * qty : 0);
        }, 0);
    }, [allVariants, quantities]);

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 font-heading tracking-tight">{t('quickOrder.title')}</h1>
                        <p className="text-sm text-gray-500 mt-1">{t('quickOrder.subtitle')}</p>
                    </div>
                    <div className="flex gap-1 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button 
                            onClick={() => setActiveTab('MANUAL')} 
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'MANUAL' ? 'bg-rani-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            {t('quickOrder.tabManual')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('SMART_PASTE')} 
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'SMART_PASTE' ? 'bg-rani-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-lg">✨</span> {t('quickOrder.tabSmart')}
                        </button>
                        <button 
                            onClick={() => setActiveTab('CSV')} 
                            className={`px-5 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'CSV' ? 'bg-rani-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <span className="text-lg">📂</span> Bulk CSV
                        </button>
                    </div>
                </div>

                {activeTab === 'CSV' && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center animate-fade-in-up mb-8">
                        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">📊</div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Order File</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Upload a standard CSV file with columns <strong>SKU</strong> and <strong>Quantity</strong>. 
                            The system will automatically map items to the catalog.
                        </p>
                        
                        <div className="flex justify-center gap-4">
                            <input type="file" accept=".csv" ref={csvInputRef} className="hidden" onChange={handleCsvUpload} />
                            <Button size="lg" onClick={() => csvInputRef.current?.click()}>
                                Select CSV File
                            </Button>
                            <Button variant="outline" size="lg" onClick={handleDownloadTemplate}>
                                Download Template
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'SMART_PASTE' && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 animate-fade-in-up mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('quickOrder.pasteLabel')}</h3>
                        <div className="flex flex-col md:flex-row gap-8">
                            <textarea 
                                className="flex-1 border border-gray-200 bg-gray-50 rounded-xl p-5 h-56 focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 focus:bg-white outline-none transition-all resize-none font-mono text-sm leading-relaxed" 
                                placeholder={t('quickOrder.pastePlaceholder')} 
                                value={pasteText} 
                                onChange={(e) => setPasteText(e.target.value)} 
                                disabled={isParsing}
                            />
                            <div className="w-full md:w-72 flex flex-col justify-center gap-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-700">How it works</p>
                                    <p className="text-xs text-gray-500 leading-relaxed italic">Our Gemini AI model parses natural language to find matching SKUs and sets automatically.</p>
                                </div>
                                <Button 
                                    onClick={handleParseAI} 
                                    disabled={isParsing || !pasteText.trim()} 
                                    fullWidth 
                                    className="h-12 text-lg"
                                >
                                    {isParsing ? t('quickOrder.parsing') : t('quickOrder.parseButton')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'MANUAL' && (
                    <>
                        <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-md shadow-lg p-5 rounded-2xl border border-rani-100 flex flex-col md:flex-row justify-between items-center mb-8 gap-6 animate-fade-in ring-1 ring-black/5">
                            <div className="flex-1 w-full md:w-auto relative">
                                <input 
                                    type="text" 
                                    placeholder={t('quickOrder.searchPlaceholder')} 
                                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 pl-11 outline-none focus:border-rani-500 focus:bg-white transition-all shadow-inner" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                <div className="text-right leading-tight border-l border-gray-200 pl-6">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Lot Subtotal</div>
                                    <div className="text-2xl font-black text-rani-600">₹{pendingTotal.toLocaleString()}</div>
                                </div>
                                <Button 
                                    onClick={handleAddToCart} 
                                    size="lg" 
                                    className="px-8 shadow-rani-500/20 shadow-xl"
                                    disabled={pendingTotal === 0}
                                >
                                    {t('quickOrder.addSelection')}
                                </Button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-12">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                                    <tr>
                                        <th className="p-5 w-24">Item</th>
                                        <th className="p-5">Product Details</th>
                                        <th className="p-5">Variant</th>
                                        <th className="p-5 text-right">Ex-Factory</th>
                                        <th className="p-5 text-center">Avail (Sets)</th>
                                        <th className="p-5 w-32 text-center">Order (Sets)</th>
                                        <th className="p-5 text-right w-36">Lot Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredItems.map((item) => {
                                        const qty = quantities[item.variant.id] || 0;
                                        const isStock = item.variant.stock > 0;
                                        return (
                                            <tr key={`${item.product.id}-${item.variant.id}`} className={`transition-colors ${qty > 0 ? "bg-rani-50/40" : "hover:bg-gray-50/50"}`}>
                                                <td className="p-5">
                                                    <div className="w-14 h-18 bg-gray-100 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
                                                        <img src={item.product.images[0]} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="font-bold text-gray-800 text-base">{item.product.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-mono mt-1 tracking-tighter uppercase">{item.product.sku}</div>
                                                </td>
                                                <td className="p-5">
                                                    <span className="bg-white px-2.5 py-1 rounded-md text-[10px] font-black text-gray-500 border border-gray-200 shadow-sm uppercase tracking-tighter">
                                                        {item.variant.color} • {item.variant.sizeRange}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right font-bold text-gray-600">₹{item.variant.pricePerPiece}/pc</td>
                                                <td className="p-5 text-center">
                                                    <span className={`text-xs font-black ${isStock ? 'text-green-600' : 'text-red-500'}`}>
                                                        {isStock ? item.variant.stock : '0'}
                                                    </span>
                                                </td>
                                                <td className="p-5">
                                                    <input 
                                                        type="number" 
                                                        min="0" 
                                                        className={`w-full border rounded-xl px-3 py-2.5 text-center outline-none transition-all ${qty > 0 ? 'border-rani-500 bg-white font-black ring-2 ring-rani-500/10' : 'border-gray-200 bg-gray-50 text-gray-400 focus:bg-white focus:border-rani-400'}`} 
                                                        value={qty || ''} 
                                                        placeholder="0" 
                                                        onChange={(e) => handleQuantityChange(item.variant.id, e.target.value)} 
                                                    />
                                                </td>
                                                <td className="p-5 text-right font-black text-gray-900 text-lg">
                                                    {qty > 0 ? `₹${(qty * (item.variant.pricePerPiece * item.variant.piecesPerSet)).toLocaleString()}` : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-20 text-center text-gray-400 font-bold">No results found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
