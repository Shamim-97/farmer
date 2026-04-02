/**
 * Example: Order Placement Component with Translations
 * Shows how to use t() for dynamic content, formatting variables, etc.
 */

'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface OrderData {
  pickupPoint: string;
  quantity: number;
  pickupDate: string;
}

export function PlaceOrderExample() {
  const { t } = useI18n();
  
  const [order, setOrder] = useState<OrderData>({
    pickupPoint: '',
    quantity: 0,
    pickupDate: '',
  });

  const [loading, setLoading] = useState(false);
  const [thresholdInfo, setThresholdInfo] = useState({
    minRequired: 100,
    currentTotal: 65,
    isFreeDelivery: false,
  });

  const deliveryFee = 50;
  const unitPrice = 120;
  const totalAmount = order.quantity * unitPrice;
  const finalDeliveryFee = thresholdInfo.isFreeDelivery ? 0 : deliveryFee;

  const handlePlaceOrder = async () => {
    setLoading(true);
    // ... order placement logic
    setLoading(false);
  };

  const remainingKg = Math.max(0, thresholdInfo.minRequired - thresholdInfo.currentTotal);

  return (
    <div className="max-w-md mx-auto px-4 py-6 bg-white rounded-lg shadow">
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6 text-slate-900">
        {t('customer.placeOrder')} {/* "Place Order" or "নতুন অর্ডার" */}
      </h1>

      {/* Village Threshold Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-slate-900 mb-3">
          {t('threshold.villageThreshold')} {/* "Village Minimum" or "গ্রাম ন্যূনতম" */}
        </h2>

        {/* Progress Bar */}
        <div className="mb-3">
          <label className="text-xs font-medium text-slate-600 mb-1 block">
            {t('threshold.currentProgress')}: {thresholdInfo.currentTotal}kg / {thresholdInfo.minRequired}kg
            {/* "Current Progress: 65kg / 100kg" or "বর্তমান অগ্রগতি: ৬৫কেজি / ১০০কেজি" */}
          </label>
          <div className="w-full bg-slate-300 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (thresholdInfo.currentTotal / thresholdInfo.minRequired) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Threshold Status Message */}
        {remainingKg > 0 ? (
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {t('threshold.almostThere', { remaining: remainingKg })}
              {/* "Almost there! 35 kg more needed." or "প্রায় এখানে! আরও ৩৫ কেজি প্রয়োজন।" */}
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">
              {t('threshold.thresholdMet')} {t('threshold.freeDeliveryAt')}
              {/* "Minimum met! Get free delivery." or "ন্যূনতম পূরণ সম্পন্ন! বিনামূল্যে ডেলিভারি পান।" */}
            </p>
          </div>
        )}
      </div>

      {/* Form */}
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handlePlaceOrder(); }}>
        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            {t('customer.quantity')} {/* "Quantity" or "পরিমাণ" */}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={order.quantity}
              onChange={(e) => setOrder({ ...order, quantity: parseInt(e.target.value) || 0 })}
              placeholder="0"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <span className="text-slate-600 text-sm font-medium">
              {t('customer.kg')} {/* "kg" or "কেজি" */}
            </span>
          </div>
        </div>

        {/* Pickup Date */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            {t('customer.pickupDate')} {/* "Pickup Date" or "পিকআপ তারিখ" */}
          </label>
          <input
            type="date"
            value={order.pickupDate}
            onChange={(e) => setOrder({ ...order, pickupDate: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Pickup Point */}
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">
            {t('customer.pickupPoint')} {/* "Pickup Point" or "পিকআপ পয়েন্ট" */}
          </label>
          <select
            value={order.pickupPoint}
            onChange={(e) => setOrder({ ...order, pickupPoint: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          >
            <option value="">— {t('common.search')} —</option> {/* "Search" or "খুঁজুন" */}
            <option value="village-center">Village Center</option>
            <option value="school">Local School</option>
          </select>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-50 p-4 rounded-lg space-y-2 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {order.quantity} {t('customer.kg')} × {t('currency.taka')}{unitPrice}
              {/* "2 kg × ৳120" */}
            </span>
            <span className="font-medium text-slate-900">
              {t('currency.taka')}{totalAmount}
              {/* "৳240" */}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">
              {t('customer.deliveryFee')}
              {/* "Delivery Fee" or "ডেলিভারি ফি" */}
            </span>
            <span className="font-medium text-slate-900">
              {finalDeliveryFee === 0 ? (
                <span className="text-green-600">{t('currency.free')}</span> {/* "Free" or "বিনামূল্যে" */}
              ) : (
                `${t('currency.taka')}${finalDeliveryFee}`
              )}
            </span>
          </div>

          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-medium text-slate-900">
              {t('customer.totalAmount')} {/* "Total Amount" or "মোট পরিমাণ" */}
            </span>
            <span className="font-bold text-lg text-slate-900">
              {t('currency.taka')}{totalAmount + finalDeliveryFee}
              {/* "৳290" */}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || order.quantity === 0}
          className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg hover:bg-slate-800 disabled:bg-slate-400 transition-colors flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t('common.loading') : t('customer.placeOrder')}
          {/* "Loading..." or "নতুন অর্ডার" */}
        </button>
      </form>
    </div>
  );
}
