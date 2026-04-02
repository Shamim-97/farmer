'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge, Button, Input } from '@/components/ui/badge';
import {
  AlertCircle,
  Upload,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  RefundReason,
  REFUND_REASON_LABELS,
  REFUND_STATUS_COLORS,
  REFUND_STATUS_LABELS,
} from '@/lib/types/refund';
import { requestRefund, getCustomerRefunds } from '@/lib/refund/actions';

interface RefundRequestFormProps {
  orderId: string;
  orderAmount: number;
  productName: string;
  onSuccess?: () => void;
}

export default function RefundRequestForm({
  orderId,
  orderAmount,
  productName,
  onSuccess,
}: RefundRequestFormProps) {
  const [stage, setStage] = useState<'list' | 'form' | 'success'>('list');
  const [reason, setReason] = useState<RefundReason | ''>('');
  const [description, setDescription] = useState('');
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (proofFiles.length + files.length > 3) {
        setError('Maximum 3 proof files allowed');
        return;
      }
      setProofFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setProofFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // TODO: Upload proof files to storage and get URLs
      // For now, using empty array
      const proofUrls: string[] = [];

      const result = await requestRefund(
        orderId,
        reason as RefundReason,
        description,
        proofUrls
      );

      if (result.success) {
        setStage('success');
        onSuccess?.();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to submit refund request');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (stage === 'success') {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900">Refund Request Submitted</h3>
            <p className="text-sm text-green-800 mt-1">
              Your refund request has been submitted for review. You'll receive updates via SMS.
            </p>
          </div>
          <div className="bg-white p-3 rounded border border-green-200 mt-4">
            <p className="text-xs text-slate-600">Expected resolution time: 3-5 business days</p>
            <p className="text-sm font-semibold text-green-900 mt-1">৳{orderAmount}</p>
          </div>
          <Button size="sm" onClick={() => setStage('list')}>
            Done
          </Button>
        </div>
      </Card>
    );
  }

  // Form state
  if (stage === 'form') {
    return (
      <Card className="p-6 bg-white">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Request Refund</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setStage('list')}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Info */}
          <div className="bg-slate-50 p-3 rounded">
            <p className="text-xs text-slate-600">Product</p>
            <p className="font-semibold text-slate-900">{productName}</p>
            <p className="text-sm text-slate-700 mt-1">Refund Amount: ৳{orderAmount}</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reason for Refund *</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(REFUND_REASON_LABELS).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-blue-50"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={key}
                    checked={reason === key}
                    onChange={(e) => {
                      setReason(e.target.value as RefundReason);
                      setError(null);
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-slate-900">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain the issue in detail..."
              className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-slate-500">Minimum 20 characters</p>
          </div>

          {/* Proof Files */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Supporting Evidence (Optional)</label>
            <p className="text-xs text-slate-600">
              Upload photos or documents (Max 3 files, 5MB each)
            </p>

            {/* File Input */}
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-700">Click to upload files</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                disabled={proofFiles.length >= 3}
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* File List */}
            {proofFiles.length > 0 && (
              <div className="space-y-2">
                {proofFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded border border-slate-200"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
            <p className="text-xs text-blue-900 font-medium">▸ Important Information</p>
            <ul className="text-xs text-blue-800 mt-2 space-y-1 ml-4 list-disc">
              <li>Refund requests can be made within 7 days of delivery</li>
              <li>Admin review typically takes 1-2 business days</li>
              <li>Refunds are processed to your original payment method</li>
              <li>Keep your refund ID for reference</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStage('list')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !reason}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Refund Request'}
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  // List state - show button to initiate refund
  return (
    <Card className="p-4 bg-white border-l-4 border-l-orange-400">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-600">Is there an issue with this order?</p>
          <p className="font-semibold text-slate-900 mt-1">Request a Refund</p>
        </div>
        <Button size="sm" onClick={() => setStage('form')}>
          Request <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
