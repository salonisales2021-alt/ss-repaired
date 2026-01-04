
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../services/db';
import { Order, User, UserRole } from '../../types';
import { Button } from '../../components/Button';
import { BrandLogo } from '../../components/BrandLogo';

export const InvoiceGenerator: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [gaddiUser, setGaddiUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isGaddiCopy = searchParams.get('mode') === 'gaddi';

    useEffect(() => {
        const load = async () => {
            if (orderId) {
                const orders = await db.getAllOrders();
                const found = orders.find(o => o.id === orderId);
                setOrder(found || null);
                
                if (found && found.gaddiId) {
                    const gaddi = await db.getUserById(found.gaddiId);
                    setGaddiUser(gaddi);
                }
            }
            setLoading(false);
        };
        load();
    }, [orderId]);

    if (loading) return <div className="p-8 text-center">Preparing Tax Invoice...</div>;
    if (!order) return <div className="p-8 text-center">Order Record Not Found.</div>;

    // Constants based on the image
    const GST_RATE = 0.05; // 5%
    const GADDI_COMMISSION_RATE = 0.03; // 3%

    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8">
            <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden bg-white p-4 rounded-xl shadow-sm border border-rani-100">
                <Button onClick={() => window.print()}>🖨️ Print Tax Invoice</Button>
                <div className="text-xs text-gray-500">
                    Supports "Builty" Proof of Delivery Format
                </div>
            </div>

            <div className="bg-white max-w-[210mm] min-h-[297mm] mx-auto shadow-2xl text-black font-sans print:shadow-none print:p-0 text-[10px] leading-tight relative">
                {/* Header Section */}
                <div className="border border-black">
                    <div className="flex">
                        <div className="w-24 p-2 border-r border-black flex items-center justify-center">
                            <BrandLogo className="h-16" />
                        </div>
                        <div className="flex-1 text-center p-2">
                            <h4 className="font-bold underline">TAX INVOICE</h4>
                            <h1 className="text-3xl font-black uppercase tracking-wider">SALONI SALES</h1>
                            <p className="font-bold">X-266, RAM NAGAR, GANDHI NAGAR</p>
                            <p className="font-bold">DELHI-110031</p>
                            <p className="font-bold">GSTIN : 07AJIPH1947G1Z9</p>
                            <p className="mt-1">Tel.: +91-99110-76258  email: salonisales2021@gmail.com</p>
                        </div>
                        <div className="w-24 p-2 border-l border-black text-xs italic text-right">
                            Original Copy
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-black">
                        <div className="border-r border-black p-2 space-y-1">
                            <div className="flex"><span className="w-24">Invoice No.</span>: <span className="font-bold">{order.id}</span></div>
                            <div className="flex"><span className="w-24">Dated</span>: <span>{new Date(order.createdAt).toLocaleDateString('en-GB')}</span></div>
                            <div className="flex"><span className="w-24">Customer P.O. No.</span>: <span className="font-bold bg-yellow-100 px-1">{order.poNumber || 'N/A'}</span></div>
                            <div className="flex"><span className="w-24">Place of Supply</span>: <span>Delhi (07)</span></div>
                            <div className="flex"><span className="w-24">Reverse Charge</span>: <span>N</span></div>
                            <div className="flex"><span className="w-24">GR/RR No.</span>: <span className="font-bold">{order.transport?.grNumber || '___________'}</span></div>
                        </div>
                        <div className="p-2 space-y-1">
                            <div className="flex"><span className="w-24">Transport</span>: <span className="font-bold">{order.transport?.transporterName || 'Self / Hand Delivery'}</span></div>
                            <div className="flex"><span className="w-24">Vehicle No.</span>: <span>{order.transport?.vehicleNumber || ''}</span></div>
                            <div className="flex"><span className="w-24">Station</span>: <span className="font-bold uppercase">{order.transport?.station || order.userCity || 'DELHI'}</span></div>
                            <div className="flex"><span className="w-24">E-Way Bill No.</span>: <span>{order.transport?.eWayBillNo || ''}</span></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-black">
                        <div className="border-r border-black p-2 h-32">
                            <p className="font-bold italic mb-1">Billed to :</p>
                            {order.gaddiId && gaddiUser ? (
                                <>
                                    <p className="font-bold text-sm uppercase">{gaddiUser.businessName}</p>
                                    <p>{gaddiUser.address}</p>
                                    <p>{gaddiUser.city}, {gaddiUser.state}</p>
                                    <p>GSTIN / UIN : {gaddiUser.gstin}</p>
                                    <p className="text-[9px] mt-1 text-gray-500">(Payment Guarantor / Gaddi)</p>
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-sm uppercase">{order.userBusinessName}</p>
                                    <p>Direct Party (No Gaddi)</p>
                                </>
                            )}
                        </div>
                        <div className="p-2 h-32">
                            <p className="font-bold italic mb-1">Shipped to :</p>
                            <p className="font-bold text-sm uppercase">{order.userBusinessName}</p>
                            <p>{order.userCity ? `${order.userCity}, ` : ''}{order.userState || 'Maharashtra'}</p>
                            <p>GSTIN / UIN : 27AEZPD0514P1Z1</p> 
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="border-t border-black">
                        <table className="w-full text-center">
                            <thead>
                                <tr className="border-b border-black font-bold">
                                    <th className="border-r border-black w-8 py-1">S.N.</th>
                                    <th className="border-r border-black text-left px-2">Description of Goods</th>
                                    <th className="border-r border-black w-16">HSN/SAC Code</th>
                                    <th className="border-r border-black w-12">Qty. Unit</th>
                                    <th className="border-r border-black w-16">List Price</th>
                                    <th className="border-r border-black w-12">Discount</th>
                                    <th className="border-r border-black w-24">CGST<br/><span className="text-[8px]">Rate Amount</span></th>
                                    <th className="border-r border-black w-24">SGST<br/><span className="text-[8px]">Rate Amount</span></th>
                                    <th className="w-20">Amount(₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item, index) => {
                                    const totalPieces = item.quantitySets * item.piecesPerSet;
                                    const listPriceTotal = item.pricePerPiece * totalPieces;
                                    
                                    // Apply 3% trade discount if Gaddi involved, else 0 or user specific
                                    const discountRate = order.gaddiId ? GADDI_COMMISSION_RATE : 0; 
                                    const discountAmount = listPriceTotal * discountRate;
                                    const taxableValue = listPriceTotal - discountAmount;
                                    
                                    const cgstAmt = taxableValue * (GST_RATE / 2);
                                    const sgstAmt = taxableValue * (GST_RATE / 2);
                                    const finalAmt = taxableValue + cgstAmt + sgstAmt;

                                    return (
                                        <tr key={index} className="align-top h-12">
                                            <td className="border-r border-black py-1">{index + 1}</td>
                                            <td className="border-r border-black text-left px-2 py-1">
                                                <p className="font-bold">{item.productName}</p>
                                                <p className="text-[9px] italic">{item.variantDescription}</p>
                                            </td>
                                            <td className="border-r border-black py-1">{item.hsnCode || '620429'}</td>
                                            <td className="border-r border-black py-1">{totalPieces} Pcs.</td>
                                            <td className="border-r border-black py-1">{item.pricePerPiece.toFixed(2)}</td>
                                            <td className="border-r border-black py-1">{(discountRate * 100).toFixed(2)} %</td>
                                            
                                            <td className="border-r border-black py-1">
                                                <div className="grid grid-cols-2">
                                                    <span>2.50%</span>
                                                    <span>{cgstAmt.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="border-r border-black py-1">
                                                <div className="grid grid-cols-2">
                                                    <span>2.50%</span>
                                                    <span>{sgstAmt.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="py-1 font-bold text-right px-2">{finalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    );
                                })}
                                {/* Fill empty space if needed for print layout */}
                                <tr className="h-48">
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td></td>
                                </tr>
                            </tbody>
                            <tfoot className="border-t border-black font-bold">
                                <tr>
                                    <td colSpan={2} className="text-right px-2 border-r border-black">Totals</td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black">{order.items.reduce((acc, i) => acc + (i.quantitySets * i.piecesPerSet), 0)} Pcs.</td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="border-r border-black"></td>
                                    <td className="text-right px-2">{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="border-t border-black p-2">
                        <div className="flex justify-between">
                            <div className="w-2/3">
                                <p className="font-bold underline">Bank Details</p>
                                <p>ACCOUNT NAME: SALONI SALES</p>
                                <p>HDFC A/C NO.: 50200066689751</p>
                                <p>IFSC CODE: HDFC0001663, GANDHI NAGAR BRANCH</p>
                                
                                <div className="mt-4 text-[9px] border border-black p-1">
                                    <p className="font-bold underline">Terms & Conditions</p>
                                    <ol className="list-decimal pl-3">
                                        <li>Goods once sold will not be taken back.</li>
                                        <li>Interest @ 18% p.a. will be charged if the payment is not made within the stipulated time.</li>
                                        <li>Subject to 'Delhi' Jurisdiction only.</li>
                                        <li>Payment Term: 30-45 Days (Secured by Gaddi).</li>
                                    </ol>
                                </div>
                            </div>
                            <div className="w-1/3 flex flex-col justify-between text-center pl-4 border-l border-black">
                                <div className="h-16"></div>
                                <div>
                                    <p className="mb-8">Receiver's Signature :</p>
                                    <p className="font-bold text-sm">for SALONI SALES</p>
                                    <div className="h-8"></div>
                                    <p className="font-bold">Authorised Signatory</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
