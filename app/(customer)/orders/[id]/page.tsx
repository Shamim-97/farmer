'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  Phone,
  CheckCircle,
  Clock,
  Truck,
  MoreVertical,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getOrderDetail, cancelOrder } from '@/lib/orders/actions';
import RefundRequestForm from '@/components/refund/request-form';
import type { OrderWithDetails } from '@/lib/types/order';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!user || !orderId) return;

    async function fetchOrder() {
      try {
        const result = await getOrderDetail(orderId);
        if (result.success) {
          setOrder(result.data || null);
        } else {
          setError(result.error || 'Failed to fetch order');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();

    // Refresh every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [user, orderId]);

  const handleCancel = async () => {
    if (!window.confirm('Are you sure? This action cannot be undone.')) {
      return;
    }

    setCanceling(true);
    try {
      const result = await cancelOrder(orderId);
      if (result.success) {
        setOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
        setError(null);
      } else {
        setError(result.error || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setCanceling(false);
      setShowMenu(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'READY':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'COLLECTED':
        return <Package className="h-5 w-5 text-green-600" />;
      case 'CANCELLED':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-purple-100 text-purple-800';
      case 'COLLECTED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '⏳ Waiting for seller confirmation';
      case 'CONFIRMED':
        return '✓ Seller confirmed your order';
      case 'READY':
        return '📦 Your order is ready for pickup';
      case 'COLLECTED':
        return '✅ Order successfully collected';
      case 'CANCELLED':
        return '❌ Order was cancelled';
      case 'ABANDONED':
        return '⚠️ Order was abandoned (no-show after 24h)';
      default:
        return 'Unknown status';
    }
  };

  const canCancel = order && ['PENDING', 'CONFIRMED'].includes(order.status);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading order...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 py-4">
        <div className="mx-auto max-w-md space-y-4 px-4">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">
              Order Not Found
            </h2>
            <button
              onClick={() => router.push('/orders')}
              className="mt-4 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="mx-auto max-w-md space-y-4 px-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 hover:bg-white"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </button>
          <h1 className="flex-1 text-2xl font-bold text-slate-900">Order Details</h1>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 hover:bg-white"
            >
              <MoreVertical className="h-5 w-5 text-slate-600" />
            </button>
            {showMenu && canCancel && (
              <div className="absolute right-0 z-10 mt-2 w-40 rounded-lg border border-slate-200 bg-white shadow-lg">
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {canceling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Order'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Status Card */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              {getStatusIcon(order.status)}
              <div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}
                >
                  {order.status}
                </div>
              </div>
            </div>
            <p className="text-sm font-bold text-slate-900">
              #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
            </p>
          </div>
          <p className="text-sm text-slate-600">{getStatusMessage(order.status)}</p>
        </div>

        {/* Product Info */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Product</h2>
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-900">
              {order.product?.name_en || 'Product'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-slate-600">Quantity</p>
                <p className="font-semibold text-slate-900">{order.quantity_kg} kg</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Unit Price</p>
                <p className="font-semibold text-slate-900">৳{order.unit_price}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Category</p>
                <p className="font-semibold text-slate-900">
                  {order.product?.category || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Seller</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {order.seller?.full_name || 'Unknown'}
              </p>
              <p className="text-xs text-slate-600">Fresh Producer</p>
            </div>
            <a
              href={`tel:${order.seller?.phone}`}
              className="rounded-lg bg-slate-100 p-2 hover:bg-slate-200"
            >
              <Phone className="h-4 w-4 text-slate-600" />
            </a>
          </div>
        </div>

        {/* Pickup Info */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Pickup Details</h2>

          <div className="flex gap-3">
            <Calendar className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-600">Date & Time</p>
              <p className="font-semibold text-slate-900">
                {formatDate(order.pickup_date)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <MapPin className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-600">Pickup Point</p>
              <p className="font-semibold text-slate-900">
                {order.pickup_point?.name || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Payment & Pricing */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-slate-900">Payment Summary</h2>

          <div className="space-y-2 border-t border-slate-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal ({order.quantity_kg} kg)</span>
              <span className="font-medium text-slate-900">
                ৳{(order.quantity_kg * order.unit_price).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Delivery Fee</span>
              <span className="font-medium text-slate-900">
                {order.delivery_fee === 0 ? (
                  <span className="text-green-600 font-semibold">✓ FREE</span>
                ) : (
                  `৳${order.delivery_fee}`
                )}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-green-600">
                ৳{order.total_amount?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          <div className="max-w-32 space-y-1 rounded-lg text-xs">
            <p className="text-slate-600">Payment Status</p>
            <p className={`font-semibold rounded px-2 py-1 w-fit ${
              order.payment_status === 'PAID'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {order.payment_status}
            </p>
          </div>

          {order.payment_method && (
            <div className="flex gap-2 items-center text-xs text-slate-600">
              <DollarSign className="h-4 w-4" />
              <span>Method: {order.payment_method}</span>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <div className="flex justify-between">
            <span>Order Placed</span>
            <span className="font-medium">{formatDate(order.created_at)}</span>
          </div>
          {order.collected_at && (
            <div className="flex justify-between">
              <span>Collected</span>
              <span className="font-medium">{formatDate(order.collected_at)}</span>
            </div>
          )}
        </div>

        {/* Next Steps */}
        {order.status === 'PENDING' && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">What's next?</p>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>✓ Waiting for seller to confirm your order</li>
              <li>• Once confirmed, you'll see the "Ready" status</li>
              <li>• Pick up your order on the scheduled date</li>
            </ul>
          </div>
        )}

        {order.status === 'CONFIRMED' && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">What's next?</p>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>✓ Seller confirmed your order</li>
              <li>• Preparing your items</li>
              <li>• You'll be notified when ready</li>
            </ul>
          </div>
        )}

        {order.status === 'READY' && (
          <div className="space-y-2 rounded-lg border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-semibold text-purple-900">📍 Ready for Pickup!</p>
            <ul className="space-y-1 text-xs text-purple-800">
              <li>✓ Your {order.quantity_kg} kg order is ready</li>
              <li>• Location: {order.pickup_point?.name}</li>
              <li>• Pick up during business hours</li>
              <li>• Payment due at pickup</li>
            </ul>
          </div>
        )}

        {order.status === 'COLLECTED' && (
          <div className="space-y-3">
            <div className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-900">✅ Order Complete!</p>
              <p className="text-xs text-green-800">
                Thank you for your purchase. Enjoy!
              </p>
            </div>
            <RefundRequestForm
              orderId={order.id}
              orderAmount={order.total_amount || 0}
              productName={order.product?.name_en || 'Product'}
            />
          </div>
        )}

        {order.status === 'CANCELLED' && (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">Order Cancelled</p>
            <p className="text-xs text-red-800">
              This order has been cancelled and cannot be restored.
            </p>
          </div>
        )}

        {/* Help */}
        <div className="text-center">
          <button
            onClick={() => router.push('/help')}
            className="text-xs text-green-600 hover:underline"
          >
            Need help? Contact support
          </button>
        </div>
      </div>
    </div>
  );
}
