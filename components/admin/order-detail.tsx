'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, Button } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle } from 'lucide-react';
import { AdminOrderDetail as AdminOrderDetailType } from '@/lib/types/admin';
import { getAdminOrderDetail } from '@/lib/admin/actions';

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800' },
  COLLECTED: { label: 'Collected', color: 'bg-purple-100 text-purple-800' },
  ABANDONED: { label: 'Abandoned', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

interface AdminOrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export default function AdminOrderDetail({ orderId, onBack }: AdminOrderDetailProps) {
  const [order, setOrder] = useState<AdminOrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const result = await getAdminOrderDetail(orderId);
        if (result.success) {
          setOrder(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to fetch order details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading order details...</p>
      </Card>
    );
  }

  if (error || !order) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error || 'Order not found'}</p>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <Badge
            className={`${statusConfig[order.status as keyof typeof statusConfig]?.color || ''}`}
          >
            {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Info */}
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Order ID</p>
              <p className="font-mono text-lg font-bold text-slate-900">{order.order_id}</p>
            </div>

            <div>
              <p className="text-sm text-slate-600">Product</p>
              <div className="flex items-center gap-2 mt-1">
                <Package className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">{order.product_name}</span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{order.quantity_kg} kg</p>
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-slate-600">Created</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>
                  {new Date(order.created_at).toLocaleString('en-US', {
                    timeZone: 'Asia/Dhaka',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-slate-600">Product Price</span>
              <span className="font-semibold">৳{order.total_amount}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold text-blue-600">
                <span>Total Amount</span>
                <span>৳{order.total_amount}</span>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-slate-600">Payment Status: {order.payment_status}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Customer & Seller Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-slate-900 mb-3">Customer Information</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">{order.customer_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span className="text-slate-900">{order.customer_phone}</span>
            </div>
          </div>
        </Card>

        {/* Seller */}
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-slate-900 mb-3">Seller Information</h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-600">Name</p>
              <p className="font-medium text-slate-900">{order.seller_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-500" />
              <span className="text-slate-900">{order.seller_phone}</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">NID Status</p>
              <Badge className="mt-1 bg-green-100 text-green-800">
                {order.seller_nid_status || 'PENDING'}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Location Information */}
      <Card className="p-4 bg-white">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Location Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Pickup Point</p>
            <p className="font-medium text-slate-900">{order.pickup_point}</p>
            {order.location_details?.pickup_point_lat && (
              <p className="text-xs text-slate-500 mt-1">
                {order.location_details.pickup_point_lat.toFixed(4)},
                {order.location_details.pickup_point_lng.toFixed(4)}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-600">Village</p>
            <p className="font-medium text-slate-900">{order.village_name}</p>
            {order.location_details?.village_lat && (
              <p className="text-xs text-slate-500 mt-1">
                {order.location_details.village_lat.toFixed(4)},
                {order.location_details.village_lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Collection Proof */}
      {order.collection_proof && (
        <Card className="p-4 bg-white">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Collection Proof
          </h3>
          <div className="space-y-4">
            {/* Photo */}
            <div>
              <p className="text-sm text-slate-600 mb-2">Photo</p>
              <img
                src={order.collection_proof.photo_url}
                alt="Collection proof"
                className="w-full max-w-sm rounded-lg border border-slate-200"
              />
            </div>

            {/* GPS Location */}
            {order.collection_proof.gps_lat && (
              <div>
                <p className="text-sm text-slate-600">GPS Location</p>
                <p className="text-slate-900 font-mono text-sm">
                  {order.collection_proof.gps_lat.toFixed(4)},
                  {order.collection_proof.gps_lng.toFixed(4)}
                </p>
              </div>
            )}

            {/* Collected At */}
            {order.collection_proof.collected_at && (
              <div>
                <p className="text-sm text-slate-600">Collected At</p>
                <p className="text-slate-900">
                  {new Date(order.collection_proof.collected_at).toLocaleString('en-US', {
                    timeZone: 'Asia/Dhaka',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
