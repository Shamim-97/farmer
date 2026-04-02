'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { placeOrder, getVillageThresholdInfo } from '@/lib/orders/actions';
import { DeliveryFeePreview, VillageProgress } from './village-progress';
import type { PlaceOrderRequest, VillageThresholdInfo } from '@/lib/types/order';

interface CheckoutFormProps {
  customerId: string;
  productId: string;
  sellerId: string;
  villageId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  onSuccess?: () => void;
}

export function CheckoutForm({
  customerId,
  productId,
  sellerId,
  villageId,
  productName,
  quantity,
  unitPrice,
  onSuccess,
}: CheckoutFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupPointId, setPickupPointId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [pickupPoints, setPickupPoints] = useState<any[]>([]);
  const [threshold, setThreshold] = useState<VillageThresholdInfo | null>(null);
  const [orderWindow, setOrderWindow] = useState<{
    isOpen: boolean;
    closesIn: string;
  }>({ isOpen: true, closesIn: '' });

  // Set default pickup date to today
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setPickupDate(dateStr);
  }, []);

  // Check order window
  useEffect(() => {
    const checkWindow = () => {
      const now = new Date();
      const dhaka = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);

      const [hours, minutes] = dhaka.split(':').map(Number);
      const closeHour = 22; // 10 PM
      const openHour = 6; // 6 AM

      let isOpen = hours >= openHour && hours < closeHour;
      let closesIn = '';

      if (isOpen) {
        const minutesUntilClose = closeHour * 60 - (hours * 60 + minutes);
        const hrs = Math.floor(minutesUntilClose / 60);
        const mins = minutesUntilClose % 60;
        closesIn = `Order window closes in ${hrs}h ${mins}m`;
      } else {
        const nextOpen = hours >= closeHour ? 24 + openHour : openHour;
        const minutesUntilOpen = (nextOpen - hours) * 60 - minutes;
        const hrs = Math.floor(minutesUntilOpen / 60);
        const mins = minutesUntilOpen % 60;
        closesIn = `Window opens in ${hrs}h ${mins}m`;
        isOpen = false;
      }

      setOrderWindow({ isOpen, closesIn });
    };

    checkWindow();
    const interval = setInterval(checkWindow, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pickup points and threshold info
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch threshold info
        const thresholdResponse = await fetch(
          `/api/village-threshold?village_id=${villageId}`
        );
        const thresholdData = await thresholdResponse.json();
        if (thresholdData.success) {
          setThreshold(thresholdData.data);
        }

        // Fetch pickup points
        const pointsResponse = await fetch(
          `/api/pickup-points?village_id=${villageId}`
        );
        const pointsData = await pointsResponse.json();
        if (pointsData.success) {
          setPickupPoints(pointsData.data);
          if (pointsData.data.length > 0) {
            setPickupPointId(pointsData.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      }
    }

    fetchData();
  }, [villageId]);

  const subtotal = quantity * unitPrice;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderWindow.isOpen) {
      setError('❌ Order window is closed (6 AM - 10 PM Bangladesh time)');
      return;
    }

    if (!pickupDate) {
      setError('Pickup date is required');
      return;
    }

    if (!pickupPointId) {
      setError('Please select a pickup point');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: PlaceOrderRequest = {
        customer_id: customerId,
        product_id: productId,
        seller_id: sellerId,
        pickup_point_id: pickupPointId,
        village_id: villageId,
        quantity_kg: quantity,
        unit_price: unitPrice,
        pickup_date: pickupDate,
        order_source: 'WEB',
        payment_method: paymentMethod,
      };

      const result = await placeOrder(request);

      if (!result.success) {
        setError(result.error || 'Failed to place order');
        return;
      }

      setSuccess(true);
      setError(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        onSuccess?.();
        router.push(`/orders/${result.data?.order_id}`);
      }, 2000);
    } catch (err) {
      console.error('Order placement error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <div className="mb-2 text-4xl">✅</div>
        <h3 className="mb-1 text-lg font-bold text-green-900">Order Placed!</h3>
        <p className="text-sm text-green-700">Redirecting to order details...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Order Window Status */}
      <div
        className={`flex items-center gap-3 rounded-lg p-4 ${
          orderWindow.isOpen
            ? 'border border-green-200 bg-green-50'
            : 'border border-red-200 bg-red-50'
        }`}
      >
        <Clock className={`h-5 w-5 ${orderWindow.isOpen ? 'text-green-600' : 'text-red-600'}`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${orderWindow.isOpen ? 'text-green-900' : 'text-red-900'}`}>
            {orderWindow.isOpen ? '✓ Orders Open' : '✗ Orders Closed'}
          </p>
          <p className={`text-xs ${orderWindow.isOpen ? 'text-green-700' : 'text-red-700'}`}>
            {orderWindow.closesIn}
          </p>
        </div>
      </div>

      {/* Village Progress */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Village Threshold Progress
        </label>
        <VillageProgress villageId={villageId} />
      </div>

      {/* Pickup Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Pickup Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          />
        </div>
      </div>

      {/* Pickup Point */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Pickup Point
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={pickupPointId}
            onChange={(e) => setPickupPointId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          >
            <option value="">Select a pickup point</option>
            {pickupPoints.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Payment Method */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Payment Method
        </label>
        <div className="space-y-2">
          {['bKash', 'Nagad', 'SSLCommerz'].map((method) => (
            <label key={method} className="flex items-center gap-3 rounded-lg border border-slate-300 p-3 cursor-pointer hover:bg-slate-50">
              <input
                type="radio"
                name="payment"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-4 w-4 text-green-600"
              />
              <CreditCard className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">{method}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Delivery Fee Preview */}
      <DeliveryFeePreview
        villageId={villageId}
        projectedKg={quantity}
        onFeeChange={setDeliveryFee}
      />

      {/* Order Summary */}
      <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">{quantity} kg × ৳{unitPrice}</span>
          <span className="font-medium text-slate-900">৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Delivery Fee</span>
          <span className="font-medium text-slate-900">
            {deliveryFee === 0 ? '✓ FREE' : `৳${deliveryFee}`}
          </span>
        </div>
        <div className="border-t border-slate-300 pt-2 flex justify-between">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="text-lg font-bold text-green-600">৳{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !orderWindow.isOpen}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition-all hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          'Place Order'
        )}
      </button>

      <p className="text-center text-xs text-slate-600">
        By placing an order, you agree to our Terms of Service
      </p>
    </form>
  );
}

import { Clock } from 'lucide-react';
