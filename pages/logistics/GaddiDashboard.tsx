
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Order, User } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { BrandLogo } from '../../components/BrandLogo';
import { useToast } from '../../components/Toaster';

export const GaddiDashboard: React.FC = () => {
    const { user } = useApp();
    const navigate = useNavigate();
    const { toast } = useToast();
    
    const [associatedOrders, setAssociatedOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'LIST' | 'PO_VIEW'>('LIST');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedOrderUser, setSelectedOrderUser] = useState<User | null>(null);
    const [poNumber, setPoNumber] = useState('');
    const [issuing, setIssuing] = useState(false);
    
    // P.O. Image State
    const [poFile, setPoFile] = useState<File | null>(null);
    const [poPreview, setPoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadAssociatedOrders();
    }, []);

    const loadAssociatedOrders = async () => {
        setLoading(true);
        const all = await db.getAllOrders();
        // Gaddi Firm sees orders billed to them
        setAssociatedOrders(all.filter(o => o.gaddiId === user?.id));
        setLoading(false);
    };

    const handleOpenPO = async (order: Order) => {
        setSelectedOrder(order);
        // Fetch user details for address
        const u = await db.getUserById(order.userId);
        setSelectedOrderUser(u);
        setPoNumber(Math.floor(10000 + Math.random() * 90000).toString()); // Random 5 digit like 10979
        setPoFile(null);
        setPoPreview(null);
        setViewMode('PO_VIEW');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleIssuePO = async () => {
        if (!selectedOrder) return;
        if (!poFile) {
            toast("Please upload the signed P.O. image to proceed.", "warning");
            return;
        }

        setIssuing(true);
        try {
            // 1. Upload the P.O. Image
            const poUrl = await db.uploadDocument(poFile);

            // 2. Update Order with P.O. Number AND Image URL
            await db.updateOrder(selectedOrder.id, {
                status: 'ACCEPTED',
                poNumber: poNumber,
                poImageUrl: poUrl
            });

            toast(`Purchase Order #${poNumber} Issued & Uploaded.`, "success");
            setViewMode('LIST');
            loadAssociatedOrders();
        } catch (err) {
            toast("Failed to upload P.O. and issue approval.", "error");
        } finally {
            setIssuing(false);
        }
    };

    if (!user || user.role !== 'GADDI') {
        return <div className="p-8 text-center">Unauthorized. Gaddi Firms only.</div>;
    }

    // --- P.O. FORM VIEW (Mimics the Image) ---
    if (viewMode === 'PO_VIEW' && selectedOrder) {
        return (
            <div className="min-h-screen bg-gray-200 p-4 flex items-center justify-center font-sans">
                <div className="bg-white w-full max-w-3xl shadow-2xl animate-fade-in relative">
                    <button onClick={() => setViewMode('LIST')} className="absolute -top-10 left-0 text-white font-bold flex items-center gap-2">← Back to List</button>
                    
                    {/* Header Strip */}
                    <div className="bg-[#1e3a8a] text-white p-2 text-center font-bold uppercase tracking-widest text-sm">
                        Purchase Order Approval
                    </div>
                    
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-4xl font-black text-[#1e3a8a] uppercase tracking-tighter">J M JAIN LLP</h1>
                                <p className="text-xs font-bold text-gray-600 mt-1 w-48">2285/9, Gali Hinga Beg,<br/>Tilak Bazar, Delhi - 110006</p>
                                <p className="text-xs font-bold text-gray-800 mt-2">GSTIN: {user.gstin || '07AAQFJ2019Q1ZT'}</p>
                            </div>
                            <div className="text-right">
                                <div className="border-2 border-gray-800 p-2 inline-block mb-2">
                                    <p className="text-xs font-bold uppercase">P.O. No.</p>
                                    <p className="text-xl font-black font-mono">{poNumber}</p>
                                </div>
                                <p className="text-xs font-bold">Date: {new Date().toLocaleDateString('en-GB')}</p>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="mb-6 border-2 border-black bg-gray-50/50 p-4">
                            <h3 className="font-bold text-sm mb-2 uppercase border-b border-black pb-1">Order Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <p className="font-bold">Ship To: <span className="font-normal">{selectedOrder.userBusinessName}</span></p>
                                    <p className="font-bold">Location: <span className="font-normal">{selectedOrder.userCity}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold">Total Items: <span className="font-normal">{selectedOrder.items.length} SKUs</span></p>
                                    <p className="font-bold">Value: <span className="font-normal text-rani-600">₹{selectedOrder.totalAmount.toLocaleString()}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* UPLOAD SECTION */}
                        <div className="mb-8">
                            <h3 className="text-sm font-black uppercase text-gray-800 mb-3 flex items-center gap-2">
                                <span>📸</span> Upload Signed P.O. Copy (Mandatory)
                            </h3>
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                                    poPreview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#1e3a8a] hover:bg-blue-50'
                                }`}
                            >
                                <input 
                                    type="file" 
                                    accept="image/jpeg, image/png, image/jpg" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={handleFileSelect} 
                                />
                                
                                {poPreview ? (
                                    <div className="relative h-48 w-full">
                                        <img src={poPreview} alt="PO Preview" className="h-full w-full object-contain" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
                                            <p className="text-white font-bold text-xs uppercase">Click to Change</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <div className="text-3xl mb-2">📄</div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Click to Upload Photo</p>
                                        <p className="text-[10px] text-gray-400 mt-1">Supports JPEG/PNG</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex justify-between items-end border-t border-gray-200 pt-4">
                            <div className="text-[10px] space-y-1 text-gray-700 max-w-md">
                                <p className="font-bold underline mb-1">Declaration:</p>
                                <ul className="list-disc pl-3 space-y-0.5">
                                    <li>I hereby authorize Saloni Sales to bill the above goods to J M Jain LLP.</li>
                                    <li>Physical P.O. copy has been signed and uploaded above.</li>
                                    <li><strong>3% trade discount</strong> applies to this credit settlement.</li>
                                </ul>
                            </div>
                            
                            {/* Action Bar */}
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setViewMode('LIST')}>Cancel</Button>
                                <Button onClick={handleIssuePO} disabled={issuing || !poFile} className="bg-[#1e3a8a] hover:bg-blue-900 text-white shadow-xl px-6">
                                    {issuing ? 'Uploading...' : '✅ Sign & Upload'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <header className="bg-luxury-black text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-lg border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <BrandLogo className="h-10" />
                    <div>
                        <h1 className="font-bold text-sm leading-tight text-white">Gaddi Firm Desk</h1>
                        <p className="text-[10px] text-rani-400 uppercase tracking-widest font-black">{user.businessName}</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => navigate('/login')}>Logout</Button>
            </header>

            <main className="p-4 container mx-auto max-w-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                    <button onClick={loadAssociatedOrders} className="text-rani-600 font-black text-xs uppercase tracking-widest border border-rani-100 px-3 py-1.5 rounded-lg bg-white shadow-sm">Refresh</button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Credit Utilized</p>
                        <p className="text-xl font-black text-red-600">₹{user.outstandingDues?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 font-black uppercase">Available Limit</p>
                        <p className="text-xl font-black text-green-600">₹{(user.creditLimit! - user.outstandingDues!).toLocaleString()}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-400">Syncing firm records...</div>
                ) : associatedOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-4xl">🤝</div>
                        <h3 className="font-bold text-gray-800 text-lg">No Active Memos</h3>
                        <p className="text-sm text-gray-500 mt-2 max-w-[200px]">Retailer orders billed to your Gaddi firm will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {associatedOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 relative overflow-hidden group hover:border-rani-200 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Ref</span>
                                        <p className="font-mono font-bold text-gray-800">#{order.id.slice(0,8).toUpperCase()}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                            {order.status === 'PENDING' ? 'NEEDS P.O.' : 'P.O. ISSUED'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client (Consignee)</span>
                                    <p className="font-bold text-gray-900 text-lg">{order.userBusinessName}</p>
                                    <div className="flex gap-4 mt-2">
                                        <div className="text-[10px] font-bold text-gray-500">Items: <span className="text-gray-900">{order.items.length} SKUs</span></div>
                                        <div className="text-[10px] font-bold text-gray-500">Value: <span className="text-rani-600 font-black">₹{order.totalAmount.toLocaleString()}</span></div>
                                    </div>
                                </div>

                                {order.status === 'PENDING' ? (
                                    <Button fullWidth onClick={() => handleOpenPO(order)} className="h-14 text-sm font-black uppercase tracking-widest shadow-lg">
                                        📝 Upload P.O. & Approve
                                    </Button>
                                ) : (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-blue-700 uppercase">P.O. Status</p>
                                                <p className="text-sm font-bold text-blue-800">Issued #{order.poNumber || 'N/A'}</p>
                                            </div>
                                            <button onClick={() => window.open(`#/admin/invoice/${order.id}?mode=gaddi`, '_blank')} className="text-xs text-rani-600 font-black underline hover:text-rani-700">View Invoice</button>
                                        </div>
                                        {order.poImageUrl && (
                                            <div className="border-t border-blue-200 pt-2">
                                                <a href={order.poImageUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                                    <span>📎</span> View Uploaded P.O. Copy
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};
