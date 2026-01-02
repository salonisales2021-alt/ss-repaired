
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../services/db';
import { Order, UserRole } from '../../types';
import { Button } from '../../components/Button';

export const InvoiceGenerator: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const isGaddiCopy = searchParams.get('mode') === 'gaddi';

    useEffect(() => {
        const load = async () => {
            if (orderId) {
                const orders = await db.getAllOrders();
                const found = orders.find(o => o.id === orderId);
                setOrder(found || null);
            }
            setLoading(false);
        };
        load();
    }, [orderId]);

    if (loading) return <div className="p-8 text-center">Preparing Bill...</div>;
    if (!order) return <div className="p-8 text-center">Order Record Not Found.</div>;

    // Price Calculations
    const retailerSubTotal = order.items.reduce((sum, i) => sum + (i.pricePerPiece * i.piecesPerSet * i.quantitySets), 0);
    const gaddiSubTotal = Math.round(retailerSubTotal * 0.97); // 3% Discount
    
    /* Fix: Declare gaddiDiscount used in JSX below */
    const gaddiDiscount = retailerSubTotal - gaddiSubTotal;
    
    const displaySubTotal = isGaddiCopy ? gaddiSubTotal : retailerSubTotal;
    const displayGst = Math.round(displaySubTotal * 0.05);
    const displayGrandTotal = displaySubTotal + displayGst;

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-rani-100">
                <div className="flex gap-4">
                    <Button variant={!isGaddiCopy ? 'primary' : 'outline'} size="sm" onClick={() => navigate(`?mode=retailer`)}>Retailer Memo</Button>
                    <Button variant={isGaddiCopy ? 'primary' : 'outline'} size="sm" onClick={() => navigate(`?mode=gaddi`)}>Gaddi Tax Invoice</Button>
                </div>
                <Button onClick={() => window.print()}>🖨️ Print Document</Button>
            </div>

            <div className="bg-white max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl p-12 text-gray-900 font-sans print:shadow-none print:p-0">
                {/* Header */}
                <div className="flex justify-between items-start border-b-4 border-luxury-black pb-8 mb-8">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter">Saloni Sales</h1>
                        <p className="text-xs text-gray-500 uppercase font-bold mt-1">Premium Kids Wear | Factory Direct</p>
                        <p className="text-sm mt-4 leading-tight">
                            X-271, Tagore Gali, Raghubarpura No. 1,<br/>Gandhi Nagar, Delhi - 110031<br/>
                            GSTIN: <strong>07AJIPH1947G1Z9</strong><br/>
                            Ph: +91 99110 76258
                        </p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-5xl font-black text-gray-100 uppercase mb-4">
                            {isGaddiCopy ? 'INVOICE' : 'MEMO'}
                        </h2>
                        {isGaddiCopy ? (
                             <div className="space-y-1">
                                <p className="font-bold text-lg">INV-#{order.id.slice(0,8).toUpperCase()}</p>
                                <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                             </div>
                        ) : (
                             <div className="space-y-1">
                                <p className="font-bold text-lg">ORDER-REF-#{order.id.slice(0,8).toUpperCase()}</p>
                                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest bg-red-50 px-2 py-1 inline-block mt-2">Internal Document / No Invoice No.</p>
                             </div>
                        )}
                    </div>
                </div>

                {/* Bill-To/Ship-To */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Bill To (Accounts)</h3>
                        {isGaddiCopy ? (
                            <div className="space-y-1">
                                <p className="font-bold text-xl">{order.gaddiName || 'Direct Cash Client'}</p>
                                <p className="text-sm text-gray-600">Gaddi Partner Account</p>
                                <p className="text-sm font-bold text-rani-600 mt-2 italic">3% Partnership Discount Applied</p>
                            </div>
                        ) : (
                            <div className="space-y-1 opacity-50">
                                <p className="font-bold text-xl">{order.gaddiName || 'N/A'}</p>
                                <p className="text-xs italic">Primary Sale Account</p>
                            </div>
                        )}
                    </div>
                    <div className="p-6 border border-gray-100 rounded-lg">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Ship To (Delivery)</h3>
                        <p className="font-bold text-xl">{order.userBusinessName}</p>
                        <p className="text-sm text-gray-600">Retail Location / Boutique</p>
                        <p className="text-xs text-gray-500 mt-2">Via Gaddi Network Protocol</p>
                    </div>
                </div>

                {/* Table */}
                <table className="w-full text-sm mb-12">
                    <thead>
                        <tr className="bg-luxury-black text-white">
                            <th className="text-left py-4 px-4 uppercase tracking-widest text-[10px]">Product / SKU</th>
                            <th className="text-right py-4 px-4 uppercase tracking-widest text-[10px]">Variant</th>
                            <th className="text-right py-4 px-4 uppercase tracking-widest text-[10px]">Sets</th>
                            <th className="text-right py-4 px-4 uppercase tracking-widest text-[10px]">Rate/Pc</th>
                            <th className="text-right py-4 px-4 uppercase tracking-widest text-[10px]">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 px-4">
                                    <p className="font-bold text-gray-800">{item.productName}</p>
                                    <p className="text-[10px] text-gray-400 font-mono">{item.productId}</p>
                                </td>
                                <td className="py-4 px-4 text-right text-xs uppercase">{item.variantDescription}</td>
                                <td className="py-4 px-4 text-right font-bold">{item.quantitySets}</td>
                                <td className="py-4 px-4 text-right">₹{item.pricePerPiece}</td>
                                <td className="py-4 px-4 text-right font-bold">₹{(item.pricePerPiece * item.piecesPerSet * item.quantitySets).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-12">
                    <div className="w-72 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-bold uppercase">Subtotal</span>
                            <span className="font-bold">₹{retailerSubTotal.toLocaleString()}</span>
                        </div>
                        
                        {isGaddiCopy && (
                            <div className="flex justify-between text-sm text-green-600">
                                <span className="font-black uppercase tracking-tighter">Gaddi Disc (3%)</span>
                                <span className="font-black">-₹{gaddiDiscount.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 font-bold uppercase">GST (5%)</span>
                            <span className="font-bold">₹{displayGst.toLocaleString()}</span>
                        </div>
                        
                        <div className="h-0.5 bg-gray-800 my-2"></div>
                        
                        <div className="flex justify-between items-center pt-2">
                            <span className="font-black text-lg uppercase tracking-tighter">Net Total</span>
                            <span className="text-3xl font-black">₹{displayGrandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-auto pt-12 border-t border-gray-200 grid grid-cols-2 gap-12 text-[10px] text-gray-500">
                    <div>
                        <h4 className="font-black text-gray-800 uppercase mb-2">Terms of Trade</h4>
                        <ul className="space-y-1 list-disc pl-4 uppercase font-bold tracking-tight">
                            <li>Goods once sold will not be taken back or exchanged.</li>
                            <li>Gaddi guarantees payment within 60 days of dispatch.</li>
                            <li>Subject to Delhi Jurisdiction only.</li>
                            {isGaddiCopy && <li>This is a valid Tax Invoice for Input Credit.</li>}
                            {!isGaddiCopy && <li>This is an Informational Memo only (Not a Tax Invoice).</li>}
                        </ul>
                    </div>
                    <div className="text-right flex flex-col justify-end">
                        <div className="mb-12 h-1 bg-gray-100 w-48 ml-auto"></div>
                        <p className="font-black text-gray-800 uppercase tracking-widest">Authorized Signatory</p>
                        <p className="mt-1">For Saloni Sales</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
