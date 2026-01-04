
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../services/db';
import { Order, OrderDocuments, TransportDetails } from '../../types';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input';

export const OrderManager: React.FC = () => {
    const { user, addNotification } = useApp();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [loading, setLoading] = useState(false);
    
    // Action Modal State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalMode, setModalMode] = useState<'VIEW' | 'READY' | 'DISPATCH' | 'EDIT_DOCS'>('VIEW');
    
    // File Inputs
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [ewayFile, setEwayFile] = useState<File | null>(null);
    const [lrGrFile, setLrGrFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Transport Details State
    const [transportData, setTransportData] = useState<TransportDetails>({
        transporterName: 'KRISHNA FREIGHT MOVERS',
        grNumber: '',
        vehicleNumber: '',
        station: '',
        eWayBillNo: ''
    });

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        const allOrders = await db.getAllOrders();
        setOrders(allOrders);
        setLoading(false);
    };

    const filteredOrders = orders.filter(o => 
        filterStatus === 'ALL' || o.status === filterStatus
    );

    const handleAcceptOrder = async (order: Order) => {
        if (confirm(`Confirm payment received and accept Order #${order.id}?`)) {
            setLoading(true);
            const success = await db.updateOrder(order.id, { status: 'ACCEPTED' });
            if (success) {
                alert("Order Accepted");
                // TRIGGER NOTIFICATION
                addNotification({
                    recipientId: order.userId,
                    title: "Order Accepted",
                    message: `Your order #${order.id} has been accepted and is being processed.`,
                    type: "ORDER",
                    link: "/orders"
                });
                loadOrders();
            } else {
                alert("Update failed");
            }
            setLoading(false);
        }
    };

    const openReadyModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('READY');
        setInvoiceFile(null);
        setEwayFile(null);
    };

    const openDispatchModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('DISPATCH');
        setLrGrFile(null);
        // Pre-fill transport data defaults
        setTransportData({
            transporterName: 'KRISHNA FREIGHT MOVERS',
            grNumber: '',
            vehicleNumber: '',
            station: order.userCity || '',
            eWayBillNo: ''
        });
    };

    const openEditDocsModal = (order: Order) => {
        setSelectedOrder(order);
        setModalMode('EDIT_DOCS');
        setInvoiceFile(null);
        setEwayFile(null);
        setLrGrFile(null);
    };

    const handleMarkReady = async () => {
        if (!selectedOrder || !invoiceFile) {
            alert("Please upload at least the Invoice.");
            return;
        }
        
        setUploading(true);
        try {
            const invoiceUrl = await db.uploadDocument(invoiceFile);
            // Check if eway file exists before upload
            const ewayBillUrl = ewayFile ? await db.uploadDocument(ewayFile) : undefined;

            const updatedDocs: OrderDocuments = {
                ...selectedOrder.documents,
                invoiceUrl,
                ewayBillUrl
            };

            await db.updateOrder(selectedOrder.id, {
                status: 'READY',
                documents: updatedDocs
            });

            // TRIGGER NOTIFICATION
            addNotification({
                recipientId: selectedOrder.userId,
                title: "Order Ready",
                message: `Order #${selectedOrder.id} is packed and ready. Invoice generated.`,
                type: "ORDER",
                link: "/orders"
            });

            alert("Order marked as READY. Documents uploaded.");
            setSelectedOrder(null);
            loadOrders();
        } catch (e) {
            console.error(e);
            alert("Error uploading documents.");
        } finally {
            setUploading(false);
        }
    };

    const handleMarkDispatched = async () => {
        if (!selectedOrder || !transportData.grNumber) {
            alert("Please provide the Builty / GR Number.");
            return;
        }

        setUploading(true);
        try {
            let lrGrSlipUrl = undefined;
            if (lrGrFile) {
                lrGrSlipUrl = await db.uploadDocument(lrGrFile);
            }

            const updatedDocs: OrderDocuments = {
                ...selectedOrder.documents,
                lrGrSlipUrl
            };

            // This assumes db.updateOrder handles the 'transport' field update (we need to ensure this in db.ts or handle via partial object)
            // Assuming we added transport to Partial<Order>
            await db.updateOrder(selectedOrder.id, {
                status: 'DISPATCHED',
                documents: updatedDocs,
                transport: transportData,
                trackingNumber: transportData.grNumber
            } as any);

            // TRIGGER NOTIFICATION
            addNotification({
                recipientId: selectedOrder.userId,
                title: "Order Dispatched",
                message: `Builty No: ${transportData.grNumber}. Your order is on the way via ${transportData.transporterName}.`,
                type: "ORDER",
                link: "/orders"
            });

            alert("Order marked as DISPATCHED.");
            setSelectedOrder(null);
            loadOrders();
        } catch (e) {
            console.error(e);
            alert("Error updating order.");
        } finally {
            setUploading(false);
        }
    };

    const handleSaveDocs = async () => {
        if (!selectedOrder) return;
        setUploading(true);
        try {
            let invoiceUrl = selectedOrder.documents?.invoiceUrl;
            let ewayBillUrl = selectedOrder.documents?.ewayBillUrl;
            let lrGrSlipUrl = selectedOrder.documents?.lrGrSlipUrl;

            // Only upload if a new file is selected
            if (invoiceFile) invoiceUrl = await db.uploadDocument(invoiceFile);
            if (ewayFile) ewayBillUrl = await db.uploadDocument(ewayFile);
            if (lrGrFile) lrGrSlipUrl = await db.uploadDocument(lrGrFile);

            const updatedDocs: OrderDocuments = {
                invoiceUrl,
                ewayBillUrl,
                lrGrSlipUrl
            };

            // Update documents without changing status
            await db.updateOrder(selectedOrder.id, {
                documents: updatedDocs
            });

            alert("Documents updated successfully.");
            setSelectedOrder(null);
            loadOrders();
        } catch (e) {
            console.error(e);
            alert("Error updating documents.");
        } finally {
            setUploading(false);
        }
    };

    const handleMarkDelivered = async (order: Order) => {
        if (confirm(`Mark Order #${order.id} as DELIVERED?`)) {
            await db.updateOrder(order.id, { status: 'DELIVERED' });
            addNotification({
                recipientId: order.userId,
                title: "Order Delivered",
                message: `Order #${order.id} has been marked delivered. Please leave a review!`,
                type: "ORDER",
                link: `/orders`
            });
            loadOrders();
        }
    };

    const handleCancelOrder = async (order: Order) => {
        if (confirm(`Are you sure you want to CANCEL Order #${order.id}? This action cannot be undone.`)) {
             setLoading(true);
             const success = await db.updateOrder(order.id, { status: 'CANCELLED' });
             if (success) {
                 addNotification({
                    recipientId: order.userId,
                    title: "Order Cancelled",
                    message: `Order #${order.id} was cancelled by Admin. Contact support for details.`,
                    type: "ALERT",
                    link: "/orders"
                });
                 alert("Order Cancelled");
                 loadOrders();
             }
             setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'ACCEPTED': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'READY': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'DISPATCHED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
                <Button variant="outline" size="sm" onClick={loadOrders}>Refresh</Button>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {['ALL', 'PENDING', 'ACCEPTED', 'READY', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            filterStatus === status 
                            ? 'bg-rani-500 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="p-4">Order ID / Date</th>
                            <th className="p-4">Client</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center">Loading orders...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No orders found.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900">{order.id}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                        {/* New Generate Invoice Link */}
                                        <button 
                                            onClick={() => window.open(`#/admin/invoice/${order.id}`, '_blank')}
                                            className="text-[10px] text-blue-600 hover:underline mt-1 font-bold flex items-center gap-1"
                                        >
                                            📄 View Tax Invoice
                                        </button>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold">{order.userBusinessName}</div>
                                        <div className="text-xs text-gray-500">
                                            {order.gaddiId ? <span className="text-blue-600 font-bold">Via Gaddi: {order.gaddiName}</span> : `Direct: ${order.paymentDetails.method}`}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold">₹{order.totalAmount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2 items-center flex-wrap">
                                            {order.status === 'PENDING' && (
                                                <>
                                                    <Button size="sm" onClick={() => handleAcceptOrder(order)}>Accept</Button>
                                                    <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => handleCancelOrder(order)}>Cancel</Button>
                                                </>
                                            )}
                                            {order.status === 'ACCEPTED' && (
                                                <Button size="sm" onClick={() => openReadyModal(order)}>Upload Bill</Button>
                                            )}
                                            {order.status === 'READY' && (
                                                <>
                                                    <Button size="sm" onClick={() => openDispatchModal(order)}>Dispatch</Button>
                                                    <Button size="sm" variant="outline" className="ml-1" onClick={() => openEditDocsModal(order)}>Docs</Button>
                                                </>
                                            )}
                                            {order.status === 'DISPATCHED' && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => handleMarkDelivered(order)}>Delivered</Button>
                                                    <Button size="sm" variant="outline" className="ml-1" onClick={() => openEditDocsModal(order)}>Docs</Button>
                                                </>
                                            )}
                                            {order.status === 'DELIVERED' && (
                                                <span className="text-gray-400 text-xs">Completed</span>
                                            )}
                                            {order.status === 'CANCELLED' && (
                                                <span className="text-gray-400 text-xs">Cancelled</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODALS */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">
                                {modalMode === 'READY' && 'Step 2: Order Ready'}
                                {modalMode === 'DISPATCH' && 'Step 3: Create Builty (Dispatch)'}
                                {modalMode === 'EDIT_DOCS' && 'Manage Documents'}
                            </h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        {modalMode === 'READY' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">Upload documents to allow client to download them.</p>
                                
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Invoice (PDF/JPG) <span className="text-red-500">*</span></label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                    <div className="mt-2 text-xs text-gray-500">
                                        OR <button onClick={() => window.open(`#/admin/invoice/${selectedOrder.id}`, '_blank')} className="text-blue-600 hover:underline">Generate & Print Invoice</button> first, then upload it.
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload E-Way Bill (Optional)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setEwayFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                </div>

                                <Button fullWidth disabled={uploading} onClick={handleMarkReady}>
                                    {uploading ? 'Uploading...' : 'Confirm Ready & Upload'}
                                </Button>
                            </div>
                        )}

                        {modalMode === 'DISPATCH' && (
                            <div className="space-y-4">
                                <div className="bg-orange-50 border border-orange-100 p-3 rounded text-xs text-orange-800">
                                    <strong>Logistics Entry:</strong> This info will appear on the final Tax Invoice.
                                </div>
                                
                                <Input 
                                    label="Transporter Name" 
                                    value={transportData.transporterName} 
                                    onChange={e => setTransportData({...transportData, transporterName: e.target.value})} 
                                    placeholder="e.g. Krishna Freight Movers"
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="GR / Builty No." 
                                        value={transportData.grNumber} 
                                        onChange={e => setTransportData({...transportData, grNumber: e.target.value})} 
                                        placeholder="524339"
                                    />
                                    <Input 
                                        label="Vehicle No." 
                                        value={transportData.vehicleNumber} 
                                        onChange={e => setTransportData({...transportData, vehicleNumber: e.target.value})} 
                                        placeholder="RJ11GD1636"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input 
                                        label="Station / Destination" 
                                        value={transportData.station} 
                                        onChange={e => setTransportData({...transportData, station: e.target.value})} 
                                    />
                                    <Input 
                                        label="E-Way Bill No." 
                                        value={transportData.eWayBillNo} 
                                        onChange={e => setTransportData({...transportData, eWayBillNo: e.target.value})} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Builty Scan (PDF/JPG)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setLrGrFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                </div>

                                <Button fullWidth disabled={uploading} onClick={handleMarkDispatched}>
                                    {uploading ? 'Processing...' : 'Confirm Dispatch'}
                                </Button>
                            </div>
                        )}

                        {modalMode === 'EDIT_DOCS' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600">Upload or replace documents for this order.</p>
                                
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs mb-4">
                                    <p><strong>Current Documents:</strong></p>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li className="flex items-center gap-2">
                                            <span className={selectedOrder.documents?.invoiceUrl ? "text-green-600 font-bold" : "text-gray-400"}>
                                                Invoice: {selectedOrder.documents?.invoiceUrl ? "Available" : "Missing"}
                                            </span>
                                            {selectedOrder.documents?.invoiceUrl && (
                                                <a href={selectedOrder.documents.invoiceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                            )}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className={selectedOrder.documents?.ewayBillUrl ? "text-green-600 font-bold" : "text-gray-400"}>
                                                E-Way Bill: {selectedOrder.documents?.ewayBillUrl ? "Available" : "Missing"}
                                            </span>
                                            {selectedOrder.documents?.ewayBillUrl && (
                                                <a href={selectedOrder.documents.ewayBillUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                            )}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className={selectedOrder.documents?.lrGrSlipUrl ? "text-green-600 font-bold" : "text-gray-400"}>
                                                LR/GR Slip: {selectedOrder.documents?.lrGrSlipUrl ? "Available" : "Missing"}
                                            </span>
                                            {selectedOrder.documents?.lrGrSlipUrl && (
                                                <a href={selectedOrder.documents.lrGrSlipUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
                                            )}
                                        </li>
                                    </ul>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Invoice (PDF/JPG)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload E-Way Bill (PDF/JPG)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setEwayFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload LR/GR Slip (PDF/JPG)</label>
                                    <input 
                                        type="file" 
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => setLrGrFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm border border-gray-300 rounded p-2"
                                    />
                                </div>

                                <Button fullWidth disabled={uploading} onClick={handleSaveDocs}>
                                    {uploading ? 'Saving...' : 'Save Documents'}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
