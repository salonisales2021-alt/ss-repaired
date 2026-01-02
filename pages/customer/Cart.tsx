
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { PaymentCategory, UserRole, User } from '../../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toaster';

export const Cart: React.FC = () => {
  const { cart, removeFromCart, addToCart, cartTotal, clearCart, user, products, users } = useApp();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentCategory>(PaymentCategory.RAZORPAY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [distributorData, setDistributorData] = useState<User | null>(null);

  // Simplified Distributor Detection (Reverted Security Fetch)
  useEffect(() => {
      if (user?.assignedDistributorId) {
          const dist = users.find(u => u.id === user.assignedDistributorId);
          setDistributorData(dist || null);
      }
  }, [user, users]);

  // Pricing Logic
  const subtotal = cartTotal;
  
  // Calculate internal markup (still applied functionally as per business rules but label removed)
  const isGuaranteedMode = paymentMethod === PaymentCategory.DISTRIBUTOR_CREDIT;
  const guaranteeMarkup = isGuaranteedMode ? Math.round(subtotal * 0.18) : 0;
  
  const finalSubtotal = subtotal + guaranteeMarkup;
  const gstAmount = Math.round(finalSubtotal * 0.05);
  const finalAmount = finalSubtotal + gstAmount;

  useEffect(() => {
      if (distributorData) setPaymentMethod(PaymentCategory.DISTRIBUTOR_CREDIT);
  }, [distributorData]);

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setIsProcessing(true);

    const settlementDays = 90;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + settlementDays);

    const orderData = {
        userId: user.id,
        userBusinessName: user.businessName || user.fullName,
        totalAmount: finalAmount, 
        factoryAmount: finalAmount - guaranteeMarkup, 
        guarantorId: isGuaranteedMode ? distributorData?.id : undefined,
        guarantorFee: isGuaranteedMode ? guaranteeMarkup : 0,
        items: cart,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
        settlementDeadline: isGuaranteedMode ? deadline.toISOString() : undefined,
        paymentDetails: { 
            method: paymentMethod, 
            entityId: distributorData?.id, 
            entityName: distributorData?.businessName 
        }
    };

    const success = await db.createOrder(orderData);
    setIsProcessing(false);
    if (success) { 
        setOrderSuccess(true); 
        clearCart(); 
        toast(isGuaranteedMode ? "Order awaiting Distributor Approval." : "Order placed successfully.", "success");
    }
  };

  if (orderSuccess) return (
      <div className="container mx-auto px-4 py-20 text-center animate-fade-in">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner ring-4 ring-green-100">🤝</div>
          <h1 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tighter">Order Reserved</h1>
          <p className="text-gray-500 mb-10 max-w-md mx-auto leading-relaxed">
              {isGuaranteedMode 
                ? `Your order has been sent to ${distributorData?.businessName} for distribution credit approval. 90-day period will start after dispatch.`
                : "Your factory-direct order has been recorded and is processing."}
          </p>
          <Button size="lg" onClick={() => navigate('/orders')} className="px-12 h-14 font-black uppercase tracking-widest">Track Status</Button>
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
                
                {distributorData && (
                    <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 text-blue-800 font-black uppercase text-xs tracking-widest mb-2">
                            <span className="text-xl">🛡️</span> Authorized Distributor
                        </div>
                        <p className="font-bold text-gray-900 text-lg">{distributorData.businessName}</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                <span>Credit Terms</span>
                                <span className="text-blue-600">60-90 Days</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4 mb-10">
                    <div className="flex justify-between text-xs font-black uppercase text-gray-400 tracking-widest">
                        <span>Lot Subtotal</span>
                        <span className="text-gray-900">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {isGuaranteedMode && (
                        <div className="flex justify-between text-xs font-black uppercase text-blue-600 tracking-widest">
                            <span>Service Surcharge</span>
                            <span>+₹{guaranteeMarkup.toLocaleString()}</span>
                        </div>
                    )}
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
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment & Ledger Protocol</label>
                        <select 
                            className="w-full h-14 px-4 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm uppercase tracking-tight focus:ring-2 focus:ring-rani-500/20 outline-none"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value as PaymentCategory)}
                        >
                            <option value={PaymentCategory.RAZORPAY}>Direct Factory Pay (Discounted)</option>
                            {distributorData && <option value={PaymentCategory.DISTRIBUTOR_CREDIT}>Bill to {distributorData.businessName}</option>}
                        </select>
                    </div>

                    <Button fullWidth size="lg" onClick={handleCheckout} disabled={isProcessing} className="h-16 text-lg font-black uppercase tracking-[0.1em] shadow-xl shadow-rani-500/20">
                        {isProcessing ? 'Synchronizing Trade...' : isGuaranteedMode ? 'Send for Approval' : 'Place Order'}
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
