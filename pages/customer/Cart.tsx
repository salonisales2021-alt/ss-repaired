
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from '../../components/Button';
import { PaymentCategory, Order } from '../../types';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { useToast } from '../../components/Toaster';

export const Cart: React.FC = () => {
  const { cart, clearCart, user, cartTotal } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) { navigate('/login'); return; }
    setIsProcessing(true);

    const orderData: Partial<Order> = {
        userId: user.id,
        items: cart,
        paymentDetails: { method: PaymentCategory.RAZORPAY } // Defaulting for secure example
    };

    // This calls the secure RPC / DB insert
    const success = await db.createOrder(orderData);
    
    if (success) {
        toast("Order placed successfully!", "success");
        clearCart();
        navigate('/orders');
    } else {
        toast("Failed to place order. Please try again.", "error");
    }
    setIsProcessing(false);
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
            <div className="mt-6 flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <Button fullWidth onClick={handleCheckout} disabled={isProcessing} className="mt-8 h-14">
                {isProcessing ? 'Processing...' : 'Confirm Order'}
            </Button>
        </div>
      </div>
    </div>
  );
};
