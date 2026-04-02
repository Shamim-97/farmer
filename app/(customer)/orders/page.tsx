'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getCustomerOrders } from '@/lib/orders/actions';
import type { OrderWithDetails } from '@/lib/types/order';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchOrders() {
      try {
        const result = await getCustomerOrders();
        if (result.success) {
          setOrders(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'CONFIRMED':
      case 'READY':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'COLLECTED':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'CANCELLED':
      case 'ABANDONED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'CONFIRMED':
      case 'READY':
        return 'bg-blue-100 text-blue-800';
      case 'COLLECTED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
      case 'ABANDONED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading orders...</span>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !error && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">No Orders Yet</h2>
            <p className="text-sm text-slate-600">
              Place your first order to get fresh products delivered!
            </p>
            <button
              onClick={() => router.push('/products')}
              className="mt-4 inline-block w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => router.push(`/orders/${order.id}`)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:shadow-md hover:border-slate-300"
            >
              {/* Header Row */}
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {order.product?.name_en || 'Product'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{order.status}</span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="mb-3 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
                <div>
                  <p className="text-xs text-slate-600">Quantity</p>
                  <p className="font-semibold text-slate-900">
                    {order.quantity_kg} kg
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Total</p>
                  <p className="font-semibold text-slate-900">
                    ৳{order.total_amount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Pickup</p>
                  <p className="font-semibold text-slate-900">
                    {formatDate(order.pickup_date)}
                  </p>
                </div>
              </div>

              {/* Created Date */}
              <p className="text-xs text-slate-500">
                Placed {formatDate(order.created_at)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
