
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { PaymentCategory, UserRole, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toaster';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart, user, selectedClient, products, users } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentCategory>(PaymentCategory.RAZORPAY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  
  // Use selectedClient if acting as proxy, otherwise use logged-in user
  const effectiveUser = selectedClient || user;

  // Entity Resolution
  const [distributorData, setDistributorData] = useState<User | null>(null);
  const [gaddiData, setGaddiData] = useState<User | null>(null);
  const [agentData, setAgentData] = useState<User | null>(null);

  useEffect(() => {
      if (effectiveUser && users.length > 0) {
          if (effectiveUser.assignedDistributorId) {
              setDistributorData(users.find(u => u.id === effectiveUser.assignedDistributorId) || null);
          }
          if (effectiveUser.gaddiId) {
              setGaddiData(users.find(u => u.id === effectiveUser.gaddiId) || null);
          }
          if (effectiveUser.assignedAgentId) {
              setAgentData(users.find(u => u.id === effectiveUser.assignedAgentId) || null);
          }
      }
  }, [effectiveUser, users]);

  // Pricing Logic
  const subtotal = cartTotal;
  const gstAmount = Math.round(subtotal * 0.05);
  const finalAmount = subtotal + gstAmount;

  const handleCheckout = async () => {
    if (!effectiveUser) { navigate('/login'); return; }
    setIsProcessing(true);

    // Determine the entity ID and Name based on selection
    let entityId: string | undefined = undefined;
    let entityName: string | undefined = undefined;
    let gaddiId: string | undefined = undefined;
    let gaddiName: string | undefined = undefined;

    if (paymentMethod === PaymentCategory.GADDI && gaddiData) {
        entityId = gaddiData.id;
        entityName = gaddiData.businessName;
        gaddiId = gaddiData.id;
        gaddiName = gaddiData.businessName;
    } else if (paymentMethod === PaymentCategory.AGENT && agentData) {
        entityId = agentData.id;
        entityName = agentData.fullName;
    } else if (paymentMethod === PaymentCategory.DISTRIBUTOR_CREDIT && distributorData) {
        entityId = distributorData.id;
        entityName = distributorData.businessName;
    }

    const orderData = {
        userId: effectiveUser.id,
        userBusinessName: effectiveUser.businessName || effectiveUser.fullName,
        userCity: effectiveUser.city || 'Unknown',
        userState: effectiveUser.state || 'Unknown',
        totalAmount: finalAmount, 
        factoryAmount: finalAmount, // Add logic here if factory receives less due to commissions
        guarantorId: gaddiId || (paymentMethod === PaymentCategory.DISTRIBUTOR_CREDIT ? entityId : undefined),
        items: cart,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        paymentDetails: { 
            method: paymentMethod, 
            entityId: entityId, 
            entityName: entityName 
        },
        gaddiId: gaddiId,
        gaddiName: gaddiName,
        gaddiAmount: gaddiId ? finalAmount : undefined
    };

    const success = await db.createOrder(orderData);
    setIsProcessing(false);
    if (success) { 
        setOrderSuccess(true); 
        clearCart(); 
        toast("Order placed successfully.", "success");
    }
  };

  if (orderSuccess) return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner ring-4 ring-green-100">🤝</div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Order Reserved</h1>
          <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
              Order recorded for <strong>{effectiveUser?.businessName}</strong>. 
              {paymentMethod === PaymentCategory.RAZORPAY && " Payment verified."}
              {paymentMethod === PaymentCategory.GADDI && " Awaiting Gaddi P.O. Confirmation."}
              {paymentMethod === PaymentCategory.AGENT && " Sales Agent has been notified."}
              {paymentMethod === PaymentCategory.DISTRIBUTOR_CREDIT && " Awaiting Distributor Approval."}
          </p>
          <Button size="lg" onClick={() => navigate(selectedClient ? '/admin/orders' : '/orders')} className="px-12 h-14 font-black uppercase tracking-widest">
              {selectedClient ? 'Back to Admin Orders' : 'Track Status'}
          </Button>
      </div>
  );

  if (cart.length === 0) return (
      <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-black text-gray-300 uppercase tracking-[0.2em] mb-8">Cart is empty</h1>
          <Button size="lg" onClick={() => navigate('/shop')} className="px-12 h-14 font-black uppercase tracking-widest">Browse Collection</Button>
      </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-black mb-12 text-luxury-black font-heading uppercase tracking-tighter italic">Checkout <span className="text-rani-500">Lot</span></h1>

        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-6">
              {cart.map((item) => (
                  <div key={item.variantId} className="bg-white p-6 rounded-2xl shadow-sm flex items-center gap-6 border border-gray-100 group hover:shadow-md transition-all">
                      <div className="w-20 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 ring-1 ring-gray-100">
                          <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      </div>
                      <div className="flex-1">
                          <h3 className="font-black text-gray-800 uppercase text-lg tracking-tight">{item.productName}</h3>
                          <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">{item.variantDescription}</p>
                          <div className="mt-4 flex gap-4">
                            <button onClick={() => removeFromCart(item.variantId)} className="text-[10px] font-black text-red-500 uppercase hover:underline">Remove</button>
                          </div>
                      </div>
                      <div className="text-right">
                          <p className="text-xl font-black text-luxury-black">₹{(item.pricePerPiece * item.piecesPerSet * item.quantitySets).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.quantitySets} Lots Packed</p>
                      </div>
                  </div>
              ))}
          </div>

          <div className="w-full lg:w-[450px]">
            <div className="bg-white p-8 rounded-3xl shadow-2xl sticky top-24 border border-gray-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rani-500/5 rounded-full -mr-16 -mt-16"></div>
                
                {/* Proxy Mode Warning */}
                {selectedClient && (
                    <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                        <p className="text-[10px] font-black uppercase text-orange-600 mb-1 tracking-widest">⚠️ On Behalf Of</p>
                        <div className="text-sm font-bold text-gray-800">{selectedClient.businessName}</div>
                        <div className="text-xs text-gray-500">ID: {selectedClient.id}</div>
                    </div>
                )}

                {/* Linked Partner Info */}
                {(gaddiData || agentData || distributorData) && (
                    <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Linked Partners</p>
                        {gaddiData && <div className="text-xs font-bold text-gray-800">🏛️ {gaddiData.businessName} (Gaddi)</div>}
                        {agentData && <div className="text-xs font-bold text-gray-800">💼 {agentData.fullName} (Agent)</div>}
                        {distributorData && <div className="text-xs font-bold text-gray-800">🏢 {distributorData.businessName} (Distributor)</div>}
                    </div>
                )}

                <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-xs font-black uppercase text-gray-400 tracking-widest">
                        <span>Lot Subtotal</span>
                        <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-black uppercase text-gray-400 tracking-widest">
                        <span>GST (5%)</span>
                        <span className="text-gray-900">₹{gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-gray-100 my-6"></div>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="font-black text-gray-500 uppercase text-[10px] tracking-widest block mb-1">Final Amount</span>
                            <span className="text-4xl font-black text-rani-600 tracking-tighter italic">₹{finalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-2 mb-6">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Payment Protocol</label>
                        <div className="relative">
                            <select 
                                className="w-full h-14 px-4 bg-white border-2 border-gray-200 rounded-xl font-black text-sm uppercase tracking-tight focus:ring-2 focus:ring-rani-500/20 focus:border-rani-500 outline-none appearance-none"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value as PaymentCategory)}
                            >
                                <option value={PaymentCategory.RAZORPAY}>1) Razorpay (Pay Now)</option>
                                
                                {gaddiData ? (
                                    <option value={PaymentCategory.GADDI}>2) Pay via Gaddi ({gaddiData.businessName})</option>
                                ) : (
                                    <option disabled>2) Gaddi (Not Linked)</option>
                                )}

                                {agentData ? (
                                    <option value={PaymentCategory.AGENT}>3) Pay via Agent ({agentData.fullName})</option>
                                ) : (
                                    <option disabled>3) Agent (Not Assigned)</option>
                                )}

                                {distributorData ? (
                                    <option value={PaymentCategory.DISTRIBUTOR_CREDIT}>4) Pay via Distributor ({distributorData.businessName})</option>
                                ) : (
                                    <option disabled>4) Distributor (Not Linked)</option>
                                )}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                    </div>

                    <Button fullWidth size="lg" onClick={handleCheckout} disabled={isProcessing} className="h-16 text-lg font-black uppercase tracking-[0.1em] shadow-xl shadow-rani-500/20">
                        {isProcessing ? 'Processing Order...' : selectedClient ? `Place Order for ${selectedClient.businessName}` : 'Confirm Order'}
                    </Button>
                    
                    <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                        Secure B2B Transaction • Gandhi Nagar Protocol
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
};
