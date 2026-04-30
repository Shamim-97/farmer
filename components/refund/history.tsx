'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, AlertCircle, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  RefundRequestWithDetails,
  REFUND_REASON_LABELS,
  REFUND_STATUS_COLORS,
  REFUND_STATUS_LABELS,
} from '@/lib/types/refund';
import { getCustomerRefunds, getRefundDetail } from '@/lib/refund/actions';

interface RefundHistoryProps {
  onSelectRefund?: (refund: RefundRequestWithDetails) => void;
}

export default function RefundHistory({ onSelectRefund }: RefundHistoryProps) {
  const [refunds, setRefunds] = useState<RefundRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRefunds = async () => {
      setLoading(true);
      try {
        const result = await getCustomerRefunds();
        if (result.success) {
          setRefunds(result.data ?? []);
          setError(null);
        } else {
          setError(result.error ?? null);
        }
      } catch (err) {
        setError('Failed to fetch refund history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRefunds();
  }, []);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading refund history...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 border-red-200">
        <p className="text-red-800 text-sm">{error}</p>
      </Card>
    );
  }

  if (refunds.length === 0) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
        <p className="text-slate-600">No refund requests yet</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900">Your Refund Requests</h3>
        <Badge className="bg-blue-100 text-blue-800">{refunds.length}</Badge>
      </div>

      <div className="space-y-3">
        {refunds.map((refund) => (
          <Card key={refund.id} className="overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-slate-600" />
                  <p className="font-semibold text-slate-900 truncate">
                    {refund.order?.product_name || 'Product'}
                  </p>
                </div>
                <p className="text-xs text-slate-600 font-mono">Refund ID: {refund.id}</p>
              </div>
              <Badge
                className={`${REFUND_STATUS_COLORS[refund.status as keyof typeof REFUND_STATUS_COLORS] || ''}`}
              >
                {REFUND_STATUS_LABELS[refund.status as keyof typeof REFUND_STATUS_LABELS] ||
                  refund.status}
              </Badge>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Amount */}
                <div>
                  <p className="text-xs text-slate-600">Refund Amount</p>
                  <p className="font-bold text-lg text-slate-900">৳{refund.amount}</p>
                </div>

                {/* Reason */}
                <div>
                  <p className="text-xs text-slate-600">Reason</p>
                  <p className="text-sm text-slate-900">
                    {REFUND_REASON_LABELS[refund.reason as keyof typeof REFUND_REASON_LABELS] ||
                      refund.reason}
                  </p>
                </div>

                {/* Requested Date */}
                <div>
                  <p className="text-xs text-slate-600">Requested</p>
                  <p className="text-sm text-slate-900">
                    {new Date(refund.requested_at).toLocaleDateString('en-US', {
                      timeZone: 'Asia/Dhaka',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Payment Status */}
                <div>
                  <p className="text-xs text-slate-600">Payment Status</p>
                  <p className="text-sm font-medium text-slate-900">
                    {refund.payment_status === 'COMPLETED' ? (
                      <span className="text-green-600">Refunded</span>
                    ) : refund.payment_status === 'FAILED' ? (
                      <span className="text-red-600">Failed</span>
                    ) : (
                      <span className="text-yellow-600">Pending</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Rejection Reason */}
              {refund.rejection_reason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-xs font-medium text-red-800">Rejection Reason</p>
                  <p className="text-sm text-red-700 mt-1">{refund.rejection_reason}</p>
                </div>
              )}

              {/* Status Timeline */}
              <div className="bg-slate-50 p-3 rounded space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">
                    Request submitted{' '}
                    <span className="font-medium">
                      {new Date(refund.requested_at).toLocaleString('en-US', {
                        timeZone: 'Asia/Dhaka',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                </div>

                {refund.reviewed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    <span className="text-slate-700">
                      Reviewed on{' '}
                      <span className="font-medium">
                        {new Date(refund.reviewed_at).toLocaleDateString('en-US', {
                          timeZone: 'Asia/Dhaka',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                )}

                {refund.processed_at && (
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-slate-700">
                      Refund completed on{' '}
                      <span className="font-medium">
                        {new Date(refund.processed_at).toLocaleDateString('en-US', {
                          timeZone: 'Asia/Dhaka',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  </div>
                )}
              </div>

              {/* Order Details */}
              {refund.order && (
                <div className="border-t pt-3">
                  <p className="text-xs font-medium text-slate-700 mb-2">Order Details</p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-600">Order ID</p>
                      <p className="font-mono text-slate-900">{refund.order_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Village</p>
                      <p className="text-slate-900">{refund.order.village_name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expand Button */}
            {expandedId !== refund.id && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex justify-center">
                <button
                  onClick={() => setExpandedId(refund.id)}
                  className="text-xs text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View More Details
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
