

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Product } from '../../types';

export const CatalogMaker: React.FC = () => {
    const { products } = useApp();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [title, setTitle] = useState('Saloni Sales - Latest Collection');
    const [showPrices, setShowPrices] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const printRef = useRef<HTMLDivElement>(null);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handlePrint = () => {
        window.print();
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedProducts = products.filter(p => selectedIds.has(p.id));

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
            {/* Left Sidebar: Controls & Selection */}
            <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col print:hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Catalog Builder</h2>
                    
                    <div className="space-y-4">
                        <Input 
                            label="Catalog Title" 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                        />
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showPrices} 
                                onChange={(e) => setShowPrices(e.target.checked)}
                                className="w-4 h-4 accent-rani-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Show Prices</span>
                        </label>

                        <Input 
                            placeholder="Search products..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <div className="flex justify-between items-center mb-2 px-2">
                        <span className="text-xs font-bold text-gray-500 uppercase">Products ({selectedIds.size})</span>
                        <button onClick={() => setSelectedIds(new Set())} className="text-xs text-red-500 hover:underline">Clear</button>
                    </div>
                    
                    {filteredProducts.map(p => (
                        <div 
                            key={p.id} 
                            onClick={() => toggleSelection(p.id)}
                            className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all ${
                                selectedIds.has(p.id) 
                                ? 'bg-rani-50 border-rani-500' 
                                : 'bg-gray-50 border-transparent hover:border-gray-200'
                            }`}
                        >
                            <input 
                                type="checkbox" 
                                checked={selectedIds.has(p.id)} 
                                readOnly 
                                className="pointer-events-none accent-rani-500"
                            />
                            <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded bg-white" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-800 truncate">{p.name}</div>
                                <div className="text-xs text-gray-500">{p.sku}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <Button fullWidth onClick={handlePrint} disabled={selectedIds.size === 0}>
                        Print / Save as PDF
                    </Button>
                </div>
            </div>

            {/* Right: Live Preview */}
            <div className="flex-1 overflow-y-auto bg-gray-200 p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible">
                <div 
                    ref={printRef}
                    className="bg-white shadow-2xl w-[210mm] min-h-[297mm] p-12 print:shadow-none print:w-full"
                >
                    {/* Catalog Header */}
                    <div className="text-center border-b-2 border-rani-500 pb-8 mb-8">
                        <h1 className="text-4xl font-script text-rani-600 mb-2">Saloni Sales</h1>
                        <h2 className="text-2xl font-bold text-gray-800 uppercase tracking-widest">{title}</h2>
                        <p className="text-gray-500 text-sm mt-2">Premium Kids Wear Collection</p>
                    </div>

                    {/* Product Grid */}
                    {selectedProducts.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 italic">
                            Select products from the sidebar to preview catalog.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-8">
                            {selectedProducts.map(p => (
                                <div key={p.id} className="break-inside-avoid mb-4">
                                    <div className="aspect-[3/4] bg-gray-100 mb-4 rounded-sm overflow-hidden border border-gray-100">
                                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">{p.name}</h3>
                                    <p className="text-sm text-gray-500 font-mono mb-2">SKU: {p.sku}</p>
                                    
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p>Fabric: {p.fabric}</p>
                                        {/* Fix: v.size -> v.sizeRange */}
                                        <p>Sizes: {p.variants.map(v => v.sizeRange).join(', ')}</p>
                                    </div>

                                    {showPrices && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                            <span className="text-xs text-gray-400 uppercase font-bold">Wholesale Price</span>
                                            <span className="text-xl font-bold text-rani-600">₹{p.basePrice}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                        <p className="font-bold text-gray-800 mb-1">To Place Order:</p>
                        <p>Call/WhatsApp: +91 98765 43210</p>
                        <p>Email: orders@salonisales.com</p>
                        <p className="mt-4 text-xs">www.salonisales.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
