
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { db } from '../../services/db';
import { StockLog, StockMovementType, Product, ProductVariant, ProductCategory } from '../../types';
import { useToast } from '../../components/Toaster';

type InventoryTab = 'OVERVIEW' | 'STICKER_STUDIO' | 'HISTORY';

export const Inventory: React.FC = () => {
    const { products, refreshProducts, user } = useApp();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<InventoryTab>('OVERVIEW');
    const [logs, setLogs] = useState<StockLog[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedForLabel, setSelectedForLabel] = useState<{p: Product, v: ProductVariant} | null>(null);
    
    // Selection State for Bulk
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkUpdateValue, setBulkUpdateValue] = useState('');
    const [bulkMode, setBulkMode] = useState<'SET' | 'ADD'>('SET');
    const [bulkReason, setBulkReason] = useState('Bulk Batch Update');

    // Stock Adjust State (Single)
    const [adjusting, setAdjusting] = useState<{p: Product, v: ProductVariant} | null>(null);
    const [newQty, setNewQty] = useState('');
    const [reason, setReason] = useState('Periodic Audit');
    const [isSaving, setIsSaving] = useState(false);
    const [isPreBook, setIsPreBook] = useState(false);

    useEffect(() => {
        if (activeTab === 'HISTORY') db.getStockLogs().then(setLogs);
    }, [activeTab]);

    const handlePrint = () => window.print();

    const toggleSelection = (variantId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(variantId)) newSet.delete(variantId);
        else newSet.add(variantId);
        setSelectedItems(newSet);
    };

    const toggleAllVisible = (visibleVariants: string[]) => {
        if (selectedItems.size >= visibleVariants.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(visibleVariants));
        }
    };

    const openAdjustModal = (p: Product, v: ProductVariant) => {
        setAdjusting({p, v});
        setNewQty(v.stock.toString());
        setIsPreBook(p.category === ProductCategory.PRE_BOOK);
    };

    const handleSaveStock = async () => {
        if (!adjusting || !newQty) return;
        setIsSaving(true);
        try {
            const updatedVariants = adjusting.p.variants.map(v => 
                v.id === adjusting.v.id ? { ...v, stock: Number(newQty) } : v
            );
            
            // Handle Category Change (Pre-Book Toggle)
            // If turning OFF Pre-Book, revert to WESTERN (Default fallback) or keep original if not pre-book
            let newCategory = adjusting.p.category;
            if (isPreBook) {
                newCategory = ProductCategory.PRE_BOOK;
            } else if (adjusting.p.category === ProductCategory.PRE_BOOK) {
                newCategory = ProductCategory.WESTERN; 
            }

            await db.saveProduct({ 
                ...adjusting.p, 
                variants: updatedVariants,
                category: newCategory
            });
            
            await db.logStockMovement({
                id: `sl-${Date.now()}`,
                productId: adjusting.p.id,
                variantId: adjusting.v.id,
                productName: adjusting.p.name,
                variantDesc: `${adjusting.v.color} / ${adjusting.v.sizeRange}`,
                quantity: Number(newQty),
                type: 'ADJUSTMENT',
                reason: isPreBook ? `Converted to Pre-Book: ${reason}` : reason,
                date: new Date().toISOString(),
                performedBy: user?.fullName || 'Admin'
            });

            toast("Inventory updated successfully.", "success");
            setAdjusting(null);
            refreshProducts();
        } catch (err) {
            toast("Failed to update inventory.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleBulkUpdate = async () => {
        if (!bulkUpdateValue || selectedItems.size === 0) return;
        setIsSaving(true);
        const val = Number(bulkUpdateValue);
        
        try {
            // Find unique products containing the selected variants
            const affectedProductIds = new Set<string>();
            selectedItems.forEach(vid => {
                const p = products.find(prod => prod.variants.some(v => v.id === vid));
                if (p) affectedProductIds.add(p.id);
            });

            for (const pid of Array.from(affectedProductIds)) {
                const p = products.find(prod => prod.id === pid);
                if (!p) continue;

                const updatedVariants = p.variants.map(v => {
                    if (selectedItems.has(v.id)) {
                        const finalStock = bulkMode === 'SET' ? val : (v.stock + val);
                        
                        // Log each change
                        db.logStockMovement({
                            id: `sl-bulk-${Date.now()}-${v.id}`,
                            productId: p.id,
                            variantId: v.id,
                            productName: p.name,
                            variantDesc: `${v.color} / ${v.sizeRange}`,
                            quantity: finalStock,
                            type: 'ADJUSTMENT',
                            reason: bulkReason,
                            date: new Date().toISOString(),
                            performedBy: user?.fullName || 'Admin'
                        });

                        return { ...v, stock: finalStock };
                    }
                    return v;
                });

                await db.saveProduct({ ...p, variants: updatedVariants });
            }

            toast(`Updated ${selectedItems.size} items successfully.`, "success");
            setSelectedItems(new Set());
            setShowBulkModal(false);
            refreshProducts();
        } catch (err) {
            toast("Bulk update failed.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRows = products.filter(p => 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).flatMap(p => p.variants.map(v => ({ p, v })));

    const visibleVariantIds = filteredRows.map(row => row.v.id);

    return (
        <div className="animate-fade-in p-6 max-w-6xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Warehouse Logistics</h1>
                    <p className="text-sm text-gray-500">Inventory levels, audit trails and label generation.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant={activeTab === 'OVERVIEW' ? 'primary' : 'outline'} onClick={() => setActiveTab('OVERVIEW')} size="sm" className="px-5 font-black uppercase text-[10px] tracking-widest">Stock Levels</Button>
                    <Button variant={activeTab === 'STICKER_STUDIO' ? 'primary' : 'outline'} onClick={() => setActiveTab('STICKER_STUDIO')} size="sm" className="px-5 font-black uppercase text-[10px] tracking-widest">🏷️ Stickers</Button>
                    <Button variant={activeTab === 'HISTORY' ? 'primary' : 'outline'} onClick={() => setActiveTab('HISTORY')} size="sm" className="px-5 font-black uppercase text-[10px] tracking-widest">History</Button>
                </div>
            </div>

            {activeTab === 'OVERVIEW' && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden print:hidden relative">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-96">
                            <input type="text" placeholder="Filter by Product, SKU or Color..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm outline-none focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 transition-all bg-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Total SKUs Monitor: {products.length}</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white text-gray-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-gray-100">
                                <tr>
                                    <th className="p-5 w-10">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded accent-rani-500" 
                                            checked={selectedItems.size > 0 && selectedItems.size === visibleVariantIds.length}
                                            onChange={() => toggleAllVisible(visibleVariantIds)}
                                        />
                                    </th>
                                    <th className="p-5">Visual Asset</th>
                                    <th className="p-5">Entity Name</th>
                                    <th className="p-5">Variant Details</th>
                                    <th className="p-5 text-center">In-Stock (Sets)</th>
                                    <th className="p-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredRows.map(({ p, v }) => (
                                    <tr key={v.id} className={`hover:bg-gray-50/50 transition-colors group ${selectedItems.has(v.id) ? 'bg-rani-50/30' : ''}`}>
                                        <td className="p-5">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 rounded accent-rani-500" 
                                                checked={selectedItems.has(v.id)}
                                                onChange={() => toggleSelection(v.id)}
                                            />
                                        </td>
                                        <td className="p-5">
                                            <img src={p.images[0]} className="w-10 h-14 object-cover rounded shadow-sm group-hover:scale-110 transition-transform" />
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-800 text-sm leading-tight">{p.name}</div>
                                            <div className="text-[10px] font-black text-gray-400 font-mono tracking-tighter uppercase mt-0.5">{p.sku}</div>
                                            {p.category === ProductCategory.PRE_BOOK && (
                                                <span className="inline-block bg-gold-100 text-gold-700 text-[8px] font-black px-1.5 py-0.5 rounded mt-1 border border-gold-200">PRE-BOOK</span>
                                            )}
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-black text-gray-500 uppercase tracking-tighter border border-gray-200">{v.color}</span>
                                                <span className="font-mono text-[10px] text-gray-600 font-black">{v.sizeRange}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className={`text-lg font-black ${v.stock < 10 ? 'text-red-600' : 'text-luxury-black'}`}>
                                                {v.stock}
                                                {v.stock < 10 && <span className="block text-[8px] font-black text-red-500 uppercase tracking-widest mt-0.5">Refill Soon</span>}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => openAdjustModal(p, v)} 
                                                    className="bg-luxury-black text-white text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest hover:bg-rani-600 transition-all shadow-sm active:scale-95"
                                                >
                                                    Update
                                                </button>
                                                <button 
                                                    onClick={() => { setSelectedForLabel({p, v}); setActiveTab('STICKER_STUDIO'); }} 
                                                    className="bg-white border border-gray-200 text-gray-400 hover:text-rani-600 hover:border-rani-200 text-[9px] px-3 py-1.5 rounded-lg uppercase font-black tracking-widest transition-all"
                                                >
                                                    Label
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRows.length === 0 && <tr><td colSpan={6} className="p-20 text-center text-gray-300 font-black uppercase tracking-[0.3em]">No items match your query</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'STICKER_STUDIO' && (
                <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 print:hidden ring-1 ring-black/5">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-rani-500 rounded-xl flex items-center justify-center text-white text-lg font-script font-bold">L</div>
                            <h2 className="font-black text-lg text-gray-800 uppercase tracking-tight">Package Identity Engine</h2>
                        </div>
                        {selectedForLabel ? (
                            <div className="space-y-10">
                                <div className="border-[8px] border-black p-8 bg-white w-[100mm] h-[60mm] mx-auto flex flex-col justify-between font-mono text-black shadow-2xl relative">
                                    <div className="flex justify-between items-start border-b-[3px] border-black pb-3">
                                        <div>
                                            <h3 className="font-black text-2xl leading-none">SALONI SALES</h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-2">B2B Trade Fulfillment</p>
                                        </div>
                                        <div className="text-right font-black text-4xl">{selectedForLabel.v.sizeRange}</div>
                                    </div>
                                    <div className="flex-1 flex items-center justify-center py-4">
                                        <div className="text-center">
                                            <p className="text-2xl font-black uppercase tracking-tighter italic">{selectedForLabel.p.name}</p>
                                            <p className="text-sm font-bold text-gray-700 mt-1 uppercase tracking-widest">{selectedForLabel.v.color} • {selectedForLabel.p.sku}</p>
                                            <p className="text-[11px] mt-4 font-black bg-black text-white px-4 py-1.5 inline-block uppercase tracking-widest">LOT SIZE: {selectedForLabel.v.piecesPerSet} PIECES</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end border-t-[3px] border-black pt-3">
                                        <div className="w-16 h-16 bg-gray-50 flex items-center justify-center text-[7px] border-2 border-black font-black uppercase">Barcode_EAN</div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Factory Dispatch</p>
                                            <p className="text-[8px] text-gray-500 font-bold uppercase">Gandhi Nagar, Delhi-31</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button fullWidth onClick={handlePrint} size="lg" className="h-16 shadow-xl shadow-rani-500/20 font-black uppercase tracking-widest">Generate Label PDF</Button>
                                    <Button fullWidth variant="outline" onClick={() => setSelectedForLabel(null)} size="lg" className="h-16 font-black uppercase tracking-widest border-2">Switch Product</Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group hover:border-rani-300 transition-all cursor-pointer" onClick={() => setActiveTab('OVERVIEW')}>
                                <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Step 1: Select a product variant from 'Stock Levels' to generate a commercial label.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-fade-in ring-1 ring-black/5">
                    <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-black text-gray-800 uppercase tracking-tight">Stock Movement Audit Trail</h3>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last 100 Movements</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white uppercase text-[10px] font-black text-gray-400 tracking-widest border-b border-gray-100">
                                <tr><th className="p-5">Timestamp</th><th className="p-5">Trade Asset</th><th className="p-5">Action</th><th className="p-5">Qty (Sets)</th><th className="p-5">Narration</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-5 text-gray-400 font-mono text-xs">{new Date(log.date).toLocaleString()}</td>
                                        <td className="p-5 font-bold text-gray-800">{log.productName}<span className="block text-[10px] font-black text-gray-400 uppercase tracking-tighter mt-0.5">{log.variantDesc}</span></td>
                                        <td className="p-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${
                                                log.type === 'IN' ? 'bg-green-50 text-green-700 border-green-200' : 
                                                log.type === 'OUT' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>{log.type}</span>
                                        </td>
                                        <td className="p-5 font-black text-base text-gray-900">{log.quantity}</td>
                                        <td className="p-5 text-xs text-gray-500 italic">
                                            <span className="font-bold text-gray-700 block not-italic uppercase text-[9px] tracking-tight mb-0.5">By {log.performedBy}</span>
                                            "{log.reason}"
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan={5} className="p-20 text-center text-gray-300 font-black uppercase tracking-[0.3em]">Vault is empty: No history recorded</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* BULK ACTION BAR */}
            {selectedItems.size > 0 && activeTab === 'OVERVIEW' && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] bg-luxury-black text-white px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-10 animate-fade-in-up border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rani-500 rounded-full flex items-center justify-center font-black text-lg shadow-lg">{selectedItems.size}</div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Items Selected</p>
                            <p className="text-sm font-bold">Ready for Batch Operations</p>
                        </div>
                    </div>
                    <div className="h-10 w-px bg-white/10"></div>
                    <div className="flex gap-4">
                        <Button onClick={() => setShowBulkModal(true)} className="px-6 h-12 shadow-xl shadow-rani-500/20 font-black uppercase tracking-widest text-xs italic">
                            Bulk Stock Update
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedItems(new Set())} className="px-6 h-12 text-white border-white/20 hover:bg-white/10 font-black uppercase tracking-widest text-xs">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {/* ADJUST MODAL (SINGLE) */}
            {adjusting && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 ring-1 ring-black/5">
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-8 italic">Audit <span className="text-rani-500">Adjustment</span></h3>
                        <div className="bg-gray-50/50 p-6 rounded-2xl mb-8 border border-gray-100 flex gap-5 items-center">
                            <img src={adjusting.p.images[0]} className="w-16 h-20 object-cover rounded-xl shadow-md" alt="" />
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Asset Focus</p>
                                <p className="font-bold text-gray-800 leading-tight">{adjusting.p.name}</p>
                                <p className="text-[10px] font-black text-rani-600 mt-1 uppercase">{adjusting.v.color} / {adjusting.v.sizeRange}</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            {/* Stock Slider and Input */}
                            <div>
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">New Total Count (Sets)</label>
                                    <span className="text-lg font-black text-rani-600 bg-rani-50 px-2 rounded">{newQty}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="500" 
                                    value={newQty} 
                                    onChange={e => setNewQty(e.target.value)} 
                                    className="w-full accent-rani-500 mb-4 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                                />
                                <input 
                                    type="number" 
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-rani-500 text-xl font-black shadow-sm" 
                                    value={newQty} 
                                    onChange={e => setNewQty(e.target.value)} 
                                />
                            </div>

                            {/* Pre-Book Converter Toggle */}
                            <div className={`p-4 rounded-xl border-2 transition-all ${isPreBook ? 'bg-gold-50 border-gold-200' : 'bg-gray-50 border-gray-100'}`}>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{isPreBook ? '💎' : '📦'}</span>
                                        <span className={`font-black uppercase text-xs tracking-widest ${isPreBook ? 'text-gold-800' : 'text-gray-500'}`}>
                                            {isPreBook ? 'Pre-Book Exclusive' : 'Standard Stock'}
                                        </span>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={isPreBook} onChange={(e) => setIsPreBook(e.target.checked)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                                    </div>
                                </label>
                                <p className={`text-[9px] mt-2 leading-relaxed ${isPreBook ? 'text-gold-700' : 'text-gray-400'}`}>
                                    {isPreBook 
                                        ? "Item will be moved to the 'Pre-Book Club' category. Only approved VIP partners can access this stock."
                                        : "Item is available in the general 'Western/Ethnic' catalog for all B2B partners."}
                                </p>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 ml-1">Narration Protocol</label>
                                <select className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-rani-500 bg-white text-sm font-bold shadow-sm" value={reason} onChange={e => setReason(e.target.value)}>
                                    <option>Periodic Audit</option>
                                    <option>Warehouse Damage</option>
                                    <option>Sample Allocation</option>
                                    <option>Returned Item Restoration</option>
                                    <option>Correction of Entry Error</option>
                                </select>
                            </div>
                            <div className="flex gap-4 pt-6">
                                <Button fullWidth onClick={handleSaveStock} disabled={isSaving} className="h-16 shadow-xl shadow-rani-500/20 font-black uppercase tracking-widest italic">
                                    {isSaving ? 'Synching...' : 'Commit Record'}
                                </Button>
                                <Button variant="outline" onClick={() => setAdjusting(null)} className="h-16 font-black uppercase tracking-widest border-2">Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* BULK UPDATE MODAL */}
            {showBulkModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 ring-1 ring-black/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight italic">Batch <span className="text-rani-500">Execution</span></h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Applying global update to {selectedItems.size} variants</p>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl">
                                <button 
                                    onClick={() => setBulkMode('SET')} 
                                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bulkMode === 'SET' ? 'bg-luxury-black text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
                                >
                                    Set Absolute
                                </button>
                                <button 
                                    onClick={() => setBulkMode('ADD')} 
                                    className={`py-2 text-[10px] font-black uppercase rounded-lg transition-all ${bulkMode === 'ADD' ? 'bg-luxury-black text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
                                >
                                    Add/Subtract
                                </button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 ml-1">
                                    {bulkMode === 'SET' ? 'Target Stock Value (Sets)' : 'Adjustment Delta (Sets)'}
                                </label>
                                <input 
                                    type="number" 
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-rani-500 text-xl font-black shadow-sm" 
                                    value={bulkUpdateValue} 
                                    placeholder={bulkMode === 'SET' ? '0' : '+/- 10'}
                                    onChange={e => setBulkUpdateValue(e.target.value)} 
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 ml-1">Batch Justification</label>
                                <input 
                                    type="text"
                                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 outline-none focus:border-rani-500 text-sm font-bold shadow-sm" 
                                    value={bulkReason}
                                    onChange={e => setBulkReason(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button fullWidth onClick={handleBulkUpdate} disabled={isSaving || !bulkUpdateValue} className="h-16 shadow-xl shadow-rani-500/20 font-black uppercase tracking-widest italic">
                                    {isSaving ? 'Processing Batch...' : 'Run Updates'}
                                </Button>
                                <Button variant="outline" onClick={() => setShowBulkModal(false)} className="h-16 font-black uppercase tracking-widest border-2">Cancel</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
