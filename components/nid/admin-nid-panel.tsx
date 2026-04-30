'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Eye, Calendar, Phone } from 'lucide-react';
import {
  getPendingNIDApprovals,
  getRejectedNIDs,
  approveSellerNID,
  rejectSellerNID,
} from '@/lib/nid/actions';

interface NIDApprovalRequest {
  id: string;
  full_name: string;
  phone: string;
  nid_front_url: string;
  nid_back_url: string;
  created_at: string;
}

/**
 * Admin NID Approval Dashboard
 * Shows pending NIDs with photo preview and approve/reject actions
 */
export function AdminNIDApprovalDashboard() {
  const [pendingNIDs, setPendingNIDs] = useState<NIDApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<{ [key: string]: string }>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingNIDs();
  }, []);

  const fetchPendingNIDs = async () => {
    setLoading(true);
    const result = await getPendingNIDApprovals();
    if (result.success && result.data) {
      setPendingNIDs(result.data as NIDApprovalRequest[]);
    }
    setLoading(false);
  };

  const handleApprove = async (sellerId: string) => {
    setProcessingId(sellerId);
    const result = await approveSellerNID(sellerId);
    if (result.success) {
      setPendingNIDs(pendingNIDs.filter((nid) => nid.id !== sellerId));
      alert('NID approved! SMS sent to seller.');
    } else {
      alert(`Error: ${result.error}`);
    }
    setProcessingId(null);
  };

  const handleReject = async (sellerId: string) => {
    const reason = rejectionReason[sellerId];
    if (!reason || reason.trim().length === 0) {
      alert('Please enter a rejection reason');
      return;
    }

    setProcessingId(sellerId);
    const result = await rejectSellerNID(sellerId, reason);
    if (result.success) {
      setPendingNIDs(pendingNIDs.filter((nid) => nid.id !== sellerId));
      alert('NID rejected! SMS sent to seller.');
      setShowRejectForm(null);
    } else {
      alert(`Error: ${result.error}`);
    }
    setProcessingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-green-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (pendingNIDs.length === 0) {
    return (
      <div className="rounded-lg bg-blue-50 p-8 text-center border border-blue-200">
        <CheckCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <p className="text-lg font-semibold text-blue-900">All Clear</p>
        <p className="text-blue-700 mt-2">No pending NID approvals at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Pending NID Approvals ({pendingNIDs.length})
        </h2>
      </div>

      <div className="grid gap-4">
        {pendingNIDs.map((nid) => (
          <div
            key={nid.id}
            className="rounded-lg border border-gray-200 p-6 bg-white hover:shadow-lg transition"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {nid.full_name || 'Unnamed'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{nid.phone}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                {new Date(nid.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Photo Preview */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Front Photo */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                  Front Photo
                </p>
                <div className="rounded-lg bg-gray-100 overflow-hidden aspect-video flex items-center justify-center">
                  {nid.nid_front_url ? (
                    <a
                      href={nid.nid_front_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full h-full group"
                    >
                      <img
                        src={nid.nid_front_url}
                        alt="NID Front"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  ) : (
                    <p className="text-gray-400 text-sm">No image</p>
                  )}
                </div>
              </div>

              {/* Back Photo */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                  Back Photo
                </p>
                <div className="rounded-lg bg-gray-100 overflow-hidden aspect-video flex items-center justify-center">
                  {nid.nid_back_url ? (
                    <a
                      href={nid.nid_back_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative w-full h-full group"
                    >
                      <img
                        src={nid.nid_back_url}
                        alt="NID Back"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition">
                        <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </a>
                  ) : (
                    <p className="text-gray-400 text-sm">No image</p>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection Form (If Open) */}
            {showRejectForm === nid.id && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Rejection Reason (বাংলায় লিখুন)
                </label>
                <textarea
                  value={rejectionReason[nid.id] || ''}
                  onChange={(e) =>
                    setRejectionReason({
                      ...rejectionReason,
                      [nid.id]: e.target.value,
                    })
                  }
                  placeholder="e.g., নিম্নমানের ছবি, অস্পষ্ট তথ্য..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(nid.id)}
                disabled={processingId === nid.id}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-2 px-4 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <CheckCircle className="h-5 w-5" />
                {processingId === nid.id ? 'Processing...' : 'Approve'}
              </button>

              {showRejectForm === nid.id ? (
                <>
                  <button
                    onClick={() => handleReject(nid.id)}
                    disabled={processingId === nid.id}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2 px-4 font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <XCircle className="h-5 w-5" />
                    {processingId === nid.id ? 'Processing...' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(null)}
                    className="rounded-lg bg-gray-300 py-2 px-4 font-medium text-gray-700 hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowRejectForm(nid.id)}
                  disabled={processingId === nid.id}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-100 py-2 px-4 font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <XCircle className="h-5 w-5" />
                  Reject
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Admin Rejected NIDs History
 * Shows NIDs that were rejected and allow re-review if resubmitted
 */
export function AdminRejectedNIDsHistory() {
  const [rejectedNIDs, setRejectedNIDs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRejected = async () => {
      const result = await getRejectedNIDs();
      if (result.success && result.data) {
        setRejectedNIDs(result.data);
      }
      setLoading(false);
    };

    fetchRejected();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-gray-300 border-t-gray-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (rejectedNIDs.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center border border-gray-200">
        <p className="text-gray-600">No rejected NIDs</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rejectedNIDs.map((nid) => (
        <div
          key={nid.id}
          className="rounded-lg border border-gray-200 p-4 bg-red-50 hover:shadow transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{nid.full_name || 'Unnamed'}</p>
              <p className="text-sm text-red-700 mt-1">Reason: {nid.nid_rejection_reason}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {new Date(nid.created_at).toLocaleDateString()}
              </p>
              <span className="inline-block mt-1 px-2 py-1 rounded text-xs font-medium bg-red-200 text-red-800">
                Rejected
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
