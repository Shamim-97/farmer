'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { CheckoutForm } from '@/components/orders/checkout-form';

interface CartItem {
  product_id: string;
  seller_id: string;
  village_id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Prefer cart from sessionStorage (set by product detail page)
    const sessionCart = sessionStorage.getItem('cart-item');
    if (sessionCart) {
      try {
        const parsed = JSON.parse(sessionCart);
        setCart([parsed]);
        sessionStorage.removeItem('cart-item'); // Clear after reading
      } catch (err) {
        console.error('Failed to parse cart:', err);
      }
    }
    setLoading(false);
  }, []);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading checkout...</span>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-900">Cart is Empty</h2>
        <p className="text-sm text-slate-600">
          Add products from the browse page to get started
        </p>
        <button
          onClick={() => router.push('/products')}
          className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const item = cart[0];

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="mx-auto max-w-md space-y-4 px-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        </div>

        {/* Order Summary Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-slate-900">Order Summary</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600">Product</p>
              <p className="font-medium text-slate-900">{item.productName}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-slate-600">Quantity</p>
                <p className="font-semibold text-slate-900">{item.quantity} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Price/kg</p>
                <p className="font-semibold text-slate-900">৳{item.unitPrice}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Subtotal</p>
                <p className="font-semibold text-slate-900">
                  ৳{(item.quantity * item.unitPrice).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Form */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <CheckoutForm
            customerId={user.id}
            productId={item.product_id}
            sellerId={item.seller_id}
            villageId={item.village_id}
            productName={item.productName}
            quantity={item.quantity}
            unitPrice={item.unitPrice}
            onSuccess={() => {
              // Cart cleared on successful order
              setCart([]);
            }}
          />
        </div>

        {/* Help Text */}
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <h3 className="font-medium text-amber-900">📌 Pickup Info</h3>
          <ul className="space-y-1 text-xs text-amber-800">
            <li>• Orders must be placed between 6 AM - 10 PM</li>
            <li>• Free pickup if village threshold is reached</li>
            <li>• Pickup available next day at selected point</li>
            <li>• Payment processed on pickup (bKash/Nagad/Card)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
