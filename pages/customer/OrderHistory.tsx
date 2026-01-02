
// ... (imports remain same)
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db, parseAIJson } from '../../services/db';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Order, CartItem } from '../../types';
import { GoogleGenAI } from "@google/genai";
import { useLanguage } from '../../context/LanguageContext';

export const OrderHistory: React.FC = () => {
  const { user, products, addToCart } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipmentInsights, setShipmentInsights] = useState<Record<string, { text: string; status: 'GOOD' | 'ALERT' }>>({});

  useEffect(() => {
    if (user) {
        loadMyOrders();
    }
  }, [user]);

  const loadMyOrders = async () => {
      setLoading(true);
      try {
          const data = await db.getOrdersByUser(user!.id);
          setOrders(data);
          
          // Predict logistics for first few active orders
          const activeOrders = data.filter(o => o.status === 'ACCEPTED' || o.status === 'DISPATCHED').slice(0, 3);
          activeOrders.forEach(o => generateLogisticsInsight(o));
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const generateLogisticsInsight = async (order: Order) => {
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Analyze this order shipment status:
          Order ID: ${order.id}
          Current Status: ${order.status}
          Transport Method: ${order.paymentDetails.method}
          User Business: ${order.userBusinessName}
          
          Provide a 1-sentence "Shipment Insight" for the retailer.
          If status is ACCEPTED, predict time to pack.
          If status is DISPATCHED, predict arrival based on India's logistics network.
          Format: JSON { "insight": "text", "status": "GOOD" or "ALERT" }`;

          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
              config: { responseMimeType: "application/json" }
          });

          const res = parseAIJson(response.text, { insight: '', status: 'GOOD' } as any);
          if (res.insight) {
              setShipmentInsights(prev => ({
                  ...prev,
                  [order.id]: { text: res.insight, status: res.status || 'GOOD' }
              }));
          }
      } catch (e) {
          console.error(e);
      }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleReorder = (items: CartItem[]) => {
      let addedCount = 0;
      items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
              const variant = product.variants.find(v => v.id === item.variantId);
              if (variant && variant.stock > 0) {
                  // Fix: quantity -> quantitySets
                  addToCart(product, variant, item.quantitySets);
                  addedCount++;
              }
          }
      });

      if (addedCount > 0) {
          alert(`Successfully added ${addedCount} items to your cart.`);
          navigate('/cart');
      } else {
          alert("Sorry, none of these items are currently in stock.");
      }
  };

  const handleCreateMarketingKit = (items: CartItem[]) => {
      navigate('/marketing-kit', { state: { items } });
  };

  const OrderStatusStepper = ({ order }: { order: Order }) => {
     if (order.status === 'CANCELLED') return null;
     
     const steps = ['PENDING', 'ACCEPTED', 'READY', 'DISPATCHED', 'DELIVERED'];
     const currentStep = steps.indexOf(order.status);
     const progressWidth = Math.max(0, Math.min(100, (currentStep / (steps.length - 1)) * 100));

     return (
        <div className="w-full my-6 px-2">
            <div className="relative flex justify-between items-center mb-2">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0 -translate-y-1/2 rounded-full"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-rani-500 -z-0 -translate-y-1/2 rounded-full transition-all duration-700 ease-out" 
                    style={{ width: `${progressWidth}%` }}
                ></div>

                {steps.map((step, idx) => {
                    const isActive = idx <= currentStep;
                    const isCompleted = idx < currentStep;

                    return (
                        <div key={step} className="relative z-10 flex flex-col items-center group">
                            <div className={`
                                w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300
                                ${isActive ? 'bg-rani-500 border-rani-500 scale-125 shadow-md' : 'bg-white border-gray-300'}
                            `}>
                                {isCompleted && (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-between text-[8px] sm:text-[10px] font-bold uppercase tracking-wide mt-2">
                {steps.map((step, idx) => (
                    <div 
                        key={step} 
                        className={`transition-colors duration-300 text-center ${idx <= currentStep ? 'text-rani-600' : 'text-gray-400'}`}
                    >
                        {step === 'ACCEPTED' ? 'ACCEPTED (PAID)' : step}
                    </div>
                ))}
            </div>
        </div>
     );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold font-heading">Your Orders</h1>
            <Button variant="outline" size="sm" onClick={loadMyOrders}>Refresh</Button>
        </div>

        {loading ? (
            <div className="text-center py-20 text-gray-400">Loading your history...</div>
        ) : orders.length === 0 ? (
            <div className="bg-white p-12 rounded shadow-sm text-center">
                <div className="text-gray-400 mb-4 text-6xl">📦</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No orders yet</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't placed any orders with us yet.</p>
                <Button onClick={() => navigate('/shop')}>Start Shopping</Button>
            </div>
        ) : (
            <div className="space-y-8">
                {orders.map(order => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between text-sm text-gray-600 gap-4">
                            <div className="flex flex-wrap gap-8">
                                <div>
                                    <div className="uppercase text-xs font-bold mb-1">Order Placed</div>
                                    <div className="text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                                </div>
                                <div>
                                    <div className="uppercase text-xs font-bold mb-1">Total</div>
                                    <div className="font-bold text-gray-900">₹{order.totalAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div className="uppercase text-xs font-bold mb-1">Ship To</div>
                                    <div className="text-rani-600 font-medium cursor-pointer hover:underline">{order.userBusinessName}</div>
                                </div>
                            </div>
                            <div className="flex flex-col md:items-end border-t md:border-0 pt-2 md:pt-0 mt-2 md:mt-0 border-gray-200">
                                <div className="text-xs uppercase font-bold mb-1">Order # {order.id.toString().substring(0,8)}</div>
                                <div className="text-xs text-gray-500">{order.status}</div>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                                <div className="w-full md:w-2/3 pr-4">
                                    <h3 className="font-bold text-lg text-gray-800 mb-1 flex items-center gap-2">
                                        Status: 
                                        <span className={`
                                            ${order.status === 'DELIVERED' ? 'text-green-600' : ''}
                                            ${order.status === 'READY' || order.status === 'DISPATCHED' ? 'text-blue-600' : ''}
                                            ${order.status === 'PENDING' ? 'text-yellow-600' : ''}
                                            ${order.status === 'CANCELLED' ? 'text-red-600' : ''}
                                        `}>{order.status}</span>
                                    </h3>
                                    
                                    {shipmentInsights[order.id] && (
                                        <div className={`mt-4 p-3 rounded border flex gap-3 animate-fade-in ${
                                            shipmentInsights[order.id].status === 'ALERT' 
                                            ? 'bg-red-50 border-red-100 text-red-700' 
                                            : 'bg-blue-50 border-blue-100 text-blue-700'
                                        }`}>
                                            <span className="text-lg">✨</span>
                                            <div className="text-xs">
                                                <p className="font-black uppercase tracking-widest mb-1">{t('logistics.insightTitle')}</p>
                                                <p>{shipmentInsights[order.id].text}</p>
                                            </div>
                                        </div>
                                    )}

                                    {order.status === 'CANCELLED' ? (
                                        <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm mt-2 border border-red-100">
                                            This order has been cancelled. Please contact support for details.
                                        </div>
                                    ) : (
                                        <OrderStatusStepper order={order} />
                                    )}

                                    {(order.documents?.invoiceUrl || order.documents?.ewayBillUrl || order.documents?.lrGrSlipUrl) && (
                                        <div className="mt-6 border-t border-gray-100 pt-4">
                                            <h4 className="text-sm font-bold text-gray-700 mb-2">Order Documents</h4>
                                            <div className="flex flex-wrap gap-3">
                                                {order.documents.invoiceUrl && (
                                                    <a href={order.documents.invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-rani-50 text-gray-700 hover:text-rani-700 rounded text-xs font-bold border border-gray-200 transition-colors">
                                                        📄 Download Bill/Invoice
                                                    </a>
                                                )}
                                                {order.documents.ewayBillUrl && (
                                                    <a href={order.documents.ewayBillUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-rani-50 text-gray-700 hover:text-rani-700 rounded text-xs font-bold border border-gray-200 transition-colors">
                                                        🚛 Download E-Way Bill
                                                    </a>
                                                )}
                                                {order.documents.lrGrSlipUrl && (
                                                    <a href={order.documents.lrGrSlipUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-rani-50 text-gray-700 hover:text-rani-700 rounded text-xs font-bold border border-gray-200 transition-colors">
                                                        📦 Download LR/GR Slip
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                {order.paymentDetails && (
                                    <div className="mt-4 md:mt-0 text-xs text-gray-500 md:text-right bg-gray-50 p-2 rounded">
                                        <p>Payment Method: <span className="font-bold text-gray-700">{order.paymentDetails.method}</span></p>
                                        {order.paymentDetails.entityName && <p>via {order.paymentDetails.entityName}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 border-t border-gray-100 pt-6">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start group">
                                        <div className="w-20 h-24 bg-gray-100 shrink-0 border border-gray-200 rounded-sm overflow-hidden">
                                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        </div>
                                        <div className="flex-1">
                                            <Link to={`/product/${item.productId}`} className="font-bold text-gray-800 hover:text-rani-600 hover:underline text-base transition-colors">
                                                {item.productName}
                                            </Link>
                                            <p className="text-sm text-gray-500 mb-2">{item.variantDescription}</p>
                                            <div className="flex items-center gap-4 text-sm">
                                                {/* Fix: quantity -> quantitySets, price -> pricePerPiece */}
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">Sets: <strong>{item.quantitySets}</strong></span>
                                                <span className="font-bold text-gray-900">₹{item.pricePerPiece.toLocaleString()} / pc</span>
                                            </div>
                                            <div className="mt-3">
                                                <Button size="sm" variant="secondary" className="text-[10px] py-1 px-3 h-auto uppercase tracking-wide" onClick={() => handleReorder([item])}>Buy it again</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center">
                           <div className="flex gap-2">
                               <button className="text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-wider">
                                   Archive Order
                               </button>
                           </div>
                           <div className="flex gap-4">
                               <Button size="sm" variant="outline" className="text-xs py-1 h-auto" onClick={() => handleCreateMarketingKit(order.items)}>
                                   ✨ Create Marketing Kit
                               </Button>
                               {order.status === 'DELIVERED' && (
                                   <Link to="/shop" className="text-xs font-bold text-rani-600 hover:underline flex items-center">Write a Review</Link>
                               )}
                           </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
