
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { PaymentCategory, Order } from '../../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { useToast } from '../../components/Toaster';
import { PricingEngine } from '../../services/pricingEngine';

export const Cart: React.FC = () => {
  const { cart, clearCart, user, cartTotal } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setIsProcessing(true);

    try {
        // 1. Calculate Authoritative Price Snapshot
        const snapshot = await PricingEngine.computeSnapshot(cart, user);

        const orderData: Partial<Order> = {
            userId: user.id,
            userBusinessName: user.businessName || user.fullName,
            items: cart,
            paymentDetails: { method: PaymentCategory.RAZORPAY },
            // Pass calculated values
            totalAmount: snapshot.final_total,
            factoryAmount: snapshot.final_total, // Simplified logic, commission separated in breakdown
            snapshotData: snapshot
        };

        // 2. Submit Order with Snapshot
        const success = await db.createOrder(orderData);
        
        if (success) {
            toast("Order placed successfully!", "success");
            clearCart();
            navigate('/orders');
        } else {
            toast("Failed to place order. Please try again.", "error");
        }
    } catch (e) {
        console.error(e);
        toast("Checkout Error: Could not calculate pricing.", "error");
    } finally {
        setIsProcessing(false);
    }
  };

  if (cart.length === 0) return <div className="p-20 text-center">Cart Empty</div>;

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <div className="bg-white p-6 rounded shadow-sm">
            {cart.map(item => (
                <div key={item.variantId} className="flex justify-between border-b py-4">
                    <div>{item.productName} ({item.quantitySets} sets)</div>
                    <div>₹{(item.pricePerPiece * item.piecesPerSet * item.quantitySets).toLocaleString()}</div>
                </div>
            ))}
            
            <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-gray-500 mb-2">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                {/* Note: Dynamic discounts calculated at next step for now, or could preview here */}
                <div className="flex justify-between font-bold text-xl mt-4">
                    <span>Estimated Total</span>
                    <span>₹{cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Final tax, discounts, and commissions will be calculated and frozen upon confirmation.</p>
            </div>

            <Button fullWidth onClick={handleCheckout} disabled={isProcessing} className="mt-8 h-14">
                {isProcessing ? 'Calculating & Placing Order...' : 'Confirm Order'}
            </Button>
        </div>
      </div>
    </div>
  );
};
