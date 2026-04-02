'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, Button, Input } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { AdminRefundView, RefundStatus, REFUND_STATUS_COLORS, REFUND_STATUS_LABELS, REFUND_REASON_LABELS } from '@/lib/types/refund';
import {
  getAdminRefunds,
  approveRefund,
  rejectRefund,
  processRefund,
} from '@/lib/refund/actions';

export default function AdminRefundManager() {
  const [refunds, setRefunds] = useState<AdminRefundView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [selectedRefund, setSelectedRefund] = useState<AdminRefundView | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRefunds = async (status?: RefundStatus | '') => {
    setLoading(true);
    try {
      const result = await getAdminRefunds(status && status !== '' ? (status as RefundStatus) : undefined);
      if (result.success) {
        setRefunds(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch refund requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds(statusFilter);
  }, [statusFilter]);

  const handleApprove = async (refundId: string) => {
    setActionInProgress(refundId);
    try {
      const result = await approveRefund(refundId);
      if (result.success) {
        setRefunds((prev) =>
          prev.map((r) =>
            r.id === refundId ? { ...r, status: RefundStatus.APPROVED } : r
          )
        );
        setSelectedRefund(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to approve refund');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (refundId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setActionInProgress(refundId);
    try {
      const result = await rejectRefund(refundId, rejectionReason);
      if (result.success) {
        setRefunds((prev) =>
          prev.map((r) =>
            r.id === refundId ? { ...r, status: RefundStatus.REJECTED } : r
          )
        );
        setSelectedRefund(null);
        setRejectionReason('');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to reject refund');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleProcess = async (refundId: string) => {
    setActionInProgress(refundId);
    try {
      const result = await processRefund(refundId);
      if (result.success) {
        setRefunds((prev) =>
          prev.map((r) =>
            r.id === refundId ? { ...r, status: RefundStatus.PROCESSED } : r
          )
        );
        setSelectedRefund(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to process refund');
      console.error(err);
    } finally {
      setActionInProgress(null);
    }
  };

  // Detail view
  if (selectedRefund) {
    return (
      <div className="space-y-4">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedRefund(null);
            setRejectionReason('');
          }}
        >
          ← Back to Refunds
        </Button>

        {/* Detail Card */}
        <Card className="p-6 bg-white">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Refund Request</h2>
              <p className="text-sm text-slate-600 font-mono mt-1">ID: {selectedRefund.id}</p>
            </div>
            <Badge
              className={`${REFUND_STATUS_COLORS[selectedRefund.status as keyof typeof REFUND_STATUS_COLORS] || ''}`}
            >
              {REFUND_STATUS_LABELS[selectedRefund.status as keyof typeof REFUND_STATUS_LABELS] || selectedRefund.status}
            </Badge>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Customer & Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Customer Information</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-600">Name</p>
                  <p className="font-semibold text-slate-900">{selectedRefund.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Phone</p>
                  <p className="text-slate-900">{selectedRefund.customer_phone}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Product Information</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-slate-600">Product</p>
                  <p className="font-semibold text-slate-900">{selectedRefund.product_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Order ID</p>
                  <p className="font-mono text-slate-900 text-sm">{selectedRefund.order_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="text-xs text-blue-700 font-medium">Refund Amount</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">৳{selectedRefund.amount}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Request Reason</p>
              <p className="text-sm text-blue-900 mt-1">
                {REFUND_REASON_LABELS[selectedRefund.reason as keyof typeof REFUND_REASON_LABELS] || selectedRefund.reason}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Days Pending</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {selectedRefund.days_since_request}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-3">Timeline</p>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-slate-600" />
              <span className="text-slate-700">
                Requested{' '}
                <span className="font-medium">
                  {new Date(selectedRefund.requested_at).toLocaleDateString('en-US', {
                    timeZone: 'Asia/Dhaka',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </span>
            </div>
          </div>

          {/* Approval Section */}
          {selectedRefund.status === RefundStatus.PENDING && (
            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-slate-900">Admin Action Required</h3>

              {/* Rejection Form */}
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 space-y-3">
                <label className="block">
                  <p className="text-sm font-medium text-red-900 mb-2">Rejection Reason (if rejecting)</p>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this refund is being rejected..."
                    className="w-full px-3 py-2 border border-red-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={3}
                  />
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleApprove(selectedRefund.id)}
                  disabled={actionInProgress === selectedRefund.id}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {actionInProgress === selectedRefund.id ? 'Approving...' : 'Approve Refund'}
                </Button>
                <Button
                  onClick={() => handleReject(selectedRefund.id)}
                  disabled={actionInProgress === selectedRefund.id || !rejectionReason.trim()}
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {actionInProgress === selectedRefund.id ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          )}

          {/* Processing Section */}
          {selectedRefund.status === RefundStatus.APPROVED && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-semibold text-slate-900">Process Refund</h3>
              <p className="text-sm text-slate-600">
                This refund has been approved. Click below to process the payment.
              </p>
              <Button
                onClick={() => handleProcess(selectedRefund.id)}
                disabled={actionInProgress === selectedRefund.id}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {actionInProgress === selectedRefund.id ? 'Processing...' : 'Process Refund Payment'}
              </Button>
            </div>
          )}

          {/* Processed Section */}
          {selectedRefund.status === RefundStatus.PROCESSED && (
            <div className="border-t pt-6 bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Refund Processed</p>
                  <p className="text-sm text-green-800 mt-1">
                    The refund has been successfully processed and sent to the customer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4 bg-white">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
              className="px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value={RefundStatus.PENDING}>Pending Review</option>
              <option value={RefundStatus.APPROVED}>Approved</option>
              <option value={RefundStatus.REJECTED}>Rejected</option>
              <option value={RefundStatus.PROCESSED}>Processed</option>
            </select>
          </div>

          <Button size="sm" variant="outline" onClick={() => fetchRefunds(statusFilter)}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <div className="text-sm text-slate-600">
            {refunds.length} refund{refunds.length !== 1 ? 's' : ''}
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-slate-600">Loading refund requests...</p>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-800 text-sm">{error}</p>
        </Card>
      )}

      {/* Refund List */}
      {!loading && refunds.length > 0 && (
        <div className="space-y-2">
          {refunds.map((refund) => (
            <Card
              key={refund.id}
              className="p-4 bg-white hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRefund(refund)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-slate-900">{refund.product_name}</p>
                    <Badge className={`${REFUND_STATUS_COLORS[refund.status as keyof typeof REFUND_STATUS_COLORS] || ''}`}>
                      {REFUND_STATUS_LABELS[refund.status as keyof typeof REFUND_STATUS_LABELS] || refund.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-slate-600">
                      <p className="text-xs">Customer</p>
                      <p className="font-medium text-slate-900">{refund.customer_name}</p>
                    </div>
                    <div className="text-slate-600">
                      <p className="text-xs">Amount</p>
                      <p className="font-bold text-slate-900">৳{refund.amount}</p>
                    </div>
                    <div className="text-slate-600">
                      <p className="text-xs">Pending</p>
                      <p className="font-medium text-slate-900">{refund.days_since_request} days</p>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && refunds.length === 0 && !error && (
        <Card className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-600">No refund requests to review</p>
        </Card>
      )}
    </div>
  );
}
