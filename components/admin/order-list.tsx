'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Clock,
  MapPin,
  Phone,
  Eye,
} from 'lucide-react';
import { AdminOrderView } from '@/lib/types/admin';
import { getAdminOrders } from '@/lib/admin/actions';
import { useAdminOrderUpdates } from '@/lib/admin/hooks';
import AdminOrderDetail from './order-detail';

const statusConfig = {
  PENDING: { label: 'Pending', color: 'bg-orange-100 text-orange-800' },
  CONFIRMED: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800' },
  COLLECTED: { label: 'Collected', color: 'bg-purple-100 text-purple-800' },
  ABANDONED: { label: 'Abandoned', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
};

export default function AdminOrderList() {
  const [orders, setOrders] = useState<AdminOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const itemsPerPage = 50;

  // Fetch orders
  const fetchOrders = async (page: number, status?: string) => {
    setLoading(true);
    try {
      const result = await getAdminOrders(itemsPerPage, (page - 1) * itemsPerPage, {
        status: status || undefined,
      });

      if (result.success) {
        setOrders(result.data ?? []);
        setTotal(result.total ?? 0);
        setError(null);
      } else {
        setError(result.error ?? null);
      }
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useAdminOrderUpdates((eventType, payload) => {
    setOrders((prev) => {
      const existingIndex = prev.findIndex((o) => o.id === payload.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          status: payload.status,
          payment_status: payload.payment_status,
          updated_at: payload.updated_at,
        };
        return updated;
      } else if (eventType === 'ORDER_CREATED' && !statusFilter) {
        return [
          {
            id: payload.id,
            order_id: payload.id,
            customer_name: payload.customer?.full_name || 'Unknown',
            customer_phone: payload.customer?.phone || 'N/A',
            product_name: payload.product?.name_en || 'Product',
            quantity_kg: payload.quantity_kg,
            total_amount: payload.total_amount,
            status: payload.status,
            payment_status: payload.payment_status,
            pickup_point: payload.pickup_point?.name || 'Unknown',
            village_name: payload.village?.name_en || 'Unknown',
            seller_name: payload.seller?.full_name || 'Unknown',
            created_at: payload.created_at,
            updated_at: payload.updated_at,
          },
          ...prev,
        ];
      }
      return prev;
    });
  });

  useEffect(() => {
    fetchOrders(1, statusFilter);
  }, [statusFilter]);

  // Filter by search term
  const filteredOrders = orders.filter(
    (order) =>
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_phone.includes(searchTerm) ||
      order.order_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxPages = Math.ceil(total / itemsPerPage);

  if (selectedOrderId) {
    return <AdminOrderDetail orderId={selectedOrderId} onBack={() => setSelectedOrderId(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by customer name, phone, or order ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="COLLECTED">Collected</SelectItem>
                <SelectItem value="ABANDONED">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info */}
          <div className="flex items-center justify-end text-sm text-slate-600">
            Showing {filteredOrders.length} of {total} orders
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading orders...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {/* Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedOrderId(order.id)}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left side - Order info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm text-slate-500">Order ID: {order.order_id}</span>
                      <h3 className="font-semibold text-slate-900">{order.product_name}</h3>
                      <p className="text-sm text-slate-600">
                        {order.quantity_kg} kg • ৳{order.total_amount}
                      </p>
                    </div>
                    <Badge className={`${statusConfig[order.status as keyof typeof statusConfig]?.color || ''}`}>
                      {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                    </Badge>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-medium">Customer:</span>
                      <span>{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-medium">Seller:</span>
                      <span>{order.seller_name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3" />
                      <span>{order.pickup_point}</span>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(order.created_at).toLocaleString('en-US', {
                      timeZone: 'Asia/Dhaka',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}</span>
                  </div>
                </div>

                {/* Right side - Action */}
                <div className="flex md:flex-col items-center justify-between md:gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedOrderId(order.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-slate-600">No orders found</p>
        </Card>
      )}

      {/* Pagination */}
      {maxPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-600">
            Page {currentPage} of {maxPages}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentPage(Math.max(1, currentPage - 1));
                fetchOrders(Math.max(1, currentPage - 1), statusFilter);
              }}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCurrentPage(Math.min(maxPages, currentPage + 1));
                fetchOrders(Math.min(maxPages, currentPage + 1), statusFilter);
              }}
              disabled={currentPage === maxPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
