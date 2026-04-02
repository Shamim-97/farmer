'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle, Clock, Upload } from 'lucide-react';
import { getNIDStatus, submitNIDVerification } from '@/lib/nid/actions';
import { useAuth } from '@/lib/auth/context';

type NIDStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | null;

/**
 * Seller NID Verification Status Banner
 * Shows PENDING (yellow), APPROVED (green), or REJECTED (red) status
 */
export function NIDStatusBanner() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<NIDStatus>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      if (profile?.role === 'SELLER') {
        const result = await getNIDStatus();
        if (result.success && result.data) {
          setStatus(result.data.status);
          setReason(result.data.reason);
        }
      }
      setLoading(false);
    };

    fetchStatus();
  }, [profile]);

  if (!profile || profile.role !== 'SELLER' || loading) {
    return null;
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 border border-green-200">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <div>
          <p className="font-semibold text-green-900">NID Verified</p>
          <p className="text-sm text-green-700">আপনার NID যাচাই সম্পন্ন হয়েছে। এখন পণ্য যোগ করতে পারবেন।</p>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 border border-amber-200">
        <Clock className="h-5 w-5 text-amber-600 animate-spin" />
        <div>
          <p className="font-semibold text-amber-900">Under Review</p>
          <p className="text-sm text-amber-700">আপনার NID যাচাইয়ের অপেক্ষা করছি। ২৪ ঘণ্টার মধ্যে ফলাফল পাবেন।</p>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 border border-red-200">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <div className="flex-1">
          <p className="font-semibold text-red-900">Verification Failed</p>
          <p className="text-sm text-red-700">কারণ: {reason}</p>
          <p className="text-sm text-red-600 mt-1">আবার চেষ্টা করতে নতুন ছবি আপলোড করুন।</p>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * NID Photo Upload Form
 * Allows sellers to upload front and back NID photos
 */
interface NIDUploadFormProps {
  onSuccess?: () => void;
}

export function NIDUploadForm({ onSuccess }: NIDUploadFormProps) {
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images allowed');
      return;
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10 MB');
      return;
    }

    setError(null);

    if (side === 'front') {
      setFrontFile(file);
    } else {
      setBackFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!frontFile || !backFile) {
      setError('Both photos are required');
      setLoading(false);
      return;
    }

    try {
      // Convert files to buffers
      const frontBuffer = await frontFile.arrayBuffer();
      const backBuffer = await backFile.arrayBuffer();

      const result = await submitNIDVerification(
        Buffer.from(frontBuffer),
        Buffer.from(backBuffer),
        frontFile.name,
        backFile.name
      );

      if (result.success) {
        setSuccess(true);
        setFrontFile(null);
        setBackFile(null);

        // Reset form and show success state
        setTimeout(() => {
          onSuccess?.();
          router.refresh();
        }, 2000);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to submit NID');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center border border-green-200">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <p className="text-lg font-semibold text-green-900">NID Submitted</p>
        <p className="text-green-700 mt-2">
          আপনার NID আপলোড সম্পন্ন হয়েছে। আমরা ২৪ ঘণ্টার মধ্যে যাচাই করব।
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Front Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          NID Front Photo / এনআইডি সামনের দিক
        </label>
        <div className="relative rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'front')}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={loading}
          />
          <div className="p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {frontFile ? (
              <div>
                <p className="font-medium text-gray-900">{frontFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(frontFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP • Max 10 MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Back Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          NID Back Photo / এনআইডি পেছনের দিক
        </label>
        <div className="relative rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 transition">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'back')}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={loading}
          />
          <div className="p-6 text-center">
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            {backFile ? (
              <div>
                <p className="font-medium text-gray-900">{backFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(backFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500 mt-1">JPEG, PNG or WebP • Max 10 MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !frontFile || !backFile}
        className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Uploading...' : 'Submit for Verification'}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Clear, well-lit photos of both sides of your NID. Personal data covered except
        photo and ID number.
      </p>
    </form>
  );
}
