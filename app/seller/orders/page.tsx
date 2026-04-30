'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Package,
  CheckCircle2,
  Clock,
  Truck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getSellerOrders, confirmOrder } from '@/lib/orders/actions';
import type { OrderWithDetails } from '@/lib/types/order';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchOrders() {
      try {
        const result = await getSellerOrders();
        if (result.success) {
          setOrders((result.data || []) as OrderWithDetails[]);
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

    // Refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const result = await confirmOrder(orderId, newStatus);
      if (result.success) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus as OrderWithDetails['status'] } : o
          )
        );
      } else {
        alert(result.error || 'Failed to update order');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('An error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const getPendingOrders = () => orders.filter((o) => o.status === 'PENDING');
  const getConfirmedOrders = () => orders.filter((o) => o.status === 'CONFIRMED');
  const getReadyOrders = () => orders.filter((o) => o.status === 'READY');
  const getCollectedOrders = () => orders.filter((o) => o.status === 'COLLECTED');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4 text-amber-600" />;
      case 'CONFIRMED':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'READY':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'COLLECTED':
        return <Package className="h-4 w-4 text-green-600" />;
      default:
        return null;
    }
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
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
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
            <h2 className="text-lg font-semibold text-slate-900">
              No Orders Yet
            </h2>
            <p className="text-sm text-slate-600">
              Customers will start placing orders for your products soon!
            </p>
          </div>
        )}

        {/* Stats Bar */}
        {orders.length > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {getPendingOrders().length}
              </p>
              <p className="text-xs text-slate-600">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {getConfirmedOrders().length}
              </p>
              <p className="text-xs text-slate-600">Confirmed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {getReadyOrders().length}
              </p>
              <p className="text-xs text-slate-600">Ready</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {getCollectedOrders().length}
              </p>
              <p className="text-xs text-slate-600">Collected</p>
            </div>
          </div>
        )}

        {/* Pending Orders Section */}
        {getPendingOrders().length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-700">🔔 Pending Action</h2>
            {getPendingOrders().map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                icon={getStatusIcon('PENDING')}
                onAction={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                actionLabel="Confirm Order"
                isUpdating={updating === order.id}
                accentColor="bg-amber-50 border-amber-200"
              />
            ))}
          </div>
        )}

        {/* Confirmed Orders Section */}
        {getConfirmedOrders().length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-700">✓ Confirmed</h2>
            {getConfirmedOrders().map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                icon={getStatusIcon('CONFIRMED')}
                onAction={() => handleUpdateStatus(order.id, 'READY')}
                actionLabel="Mark Ready"
                isUpdating={updating === order.id}
                accentColor="bg-blue-50 border-blue-200"
              />
            ))}
          </div>
        )}

        {/* Ready Orders Section */}
        {getReadyOrders().length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-700">📦 Ready for Pickup</h2>
            {getReadyOrders().map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                icon={getStatusIcon('READY')}
                actionLabel="Awaiting Pickup Agent"
                isReadOnly
                accentColor="bg-purple-50 border-purple-200"
              />
            ))}
          </div>
        )}

        {/* Collected Orders Section */}
        {getCollectedOrders().length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-700">✅ Completed</h2>
            {getCollectedOrders().map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                icon={getStatusIcon('COLLECTED')}
                actionLabel="Completed"
                isReadOnly
                accentColor="bg-green-50 border-green-200"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithDetails;
  icon: React.ReactNode;
  onAction?: () => void;
  actionLabel: string;
  isUpdating?: boolean;
  isReadOnly?: boolean;
  accentColor: string;
}

function OrderCard({
  order,
  icon,
  onAction,
  actionLabel,
  isUpdating,
  isReadOnly,
  accentColor,
}: OrderCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-3 ${accentColor}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 items-start gap-2">
          {icon}
          <div>
            <p className="font-semibold text-slate-900">
              {order.product?.name_en || 'Product'}
            </p>
            <p className="text-xs text-slate-600">
              Order #{order.id?.slice(0, 8).toUpperCase() || 'N/A'}
            </p>
          </div>
        </div>
        <p className="text-sm font-bold text-slate-900">
          ৳{order.total_amount?.toLocaleString() || 0}
        </p>
      </div>

      {/* Details */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-300 pt-2 text-xs">
        <div>
          <p className="text-slate-600">Quantity</p>
          <p className="font-semibold text-slate-900">{order.quantity_kg} kg</p>
        </div>
        <div>
          <p className="text-slate-600">Customer</p>
          <p className="font-semibold text-slate-900">
            {(order as any).customer?.full_name?.split(' ')[0] || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-slate-600">Pickup</p>
          <p className="font-semibold text-slate-900">
            {formatDate(order.pickup_date)}
          </p>
        </div>
      </div>

      {/* Action Button */}
      {!isReadOnly && (
        <button
          onClick={onAction}
          disabled={isUpdating}
          className="w-full rounded-lg bg-slate-600 py-2 text-xs font-medium text-white transition-all hover:bg-slate-700 disabled:bg-slate-400 flex items-center justify-center gap-1"
        >
          {isUpdating ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Updating...
            </>
          ) : (
            actionLabel
          )}
        </button>
      )}
      {isReadOnly && (
        <div className="w-full rounded-lg bg-slate-100 py-2 text-center text-xs font-medium text-slate-600">
          {actionLabel}
        </div>
      )}
    </div>
  );
}
