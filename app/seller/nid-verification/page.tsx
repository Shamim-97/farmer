import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile, isApprovedSeller } from '@/lib/auth/helpers';
import { NIDStatusBanner, NIDUploadForm } from '@/components/nid/nid-verification';

/**
 * /seller/nid-verification
 * Page for sellers to upload and track NID verification status
 */
export default async function NIDVerificationPage() {
  const profile = await getCurrentUserProfile();

  // Redirect if not authenticated
  if (!profile) {
    redirect('/auth/signin');
  }

  // Redirect if not a seller
  if (profile.role !== 'SELLER') {
    redirect('/dashboard');
  }

  // If already approved, redirect to dashboard
  if (profile.nid_status === 'APPROVED') {
    redirect('/seller/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">NID Verification</h1>
          <p className="mt-2 text-gray-600">আপনার পরিচয় যাচাই করুন</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Status Banner */}
        <div className="mb-8">
          <NIDStatusBanner />
        </div>

        {/* Upload Form */}
        {(
          <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {profile.nid_status === 'REJECTED' ? 'Resubmit NID' : 'Submit NID'}
            </h2>

            <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Required Information</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Clear photo of NID front side</li>
                <li>✓ Clear photo of NID back side</li>
                <li>✓ Good lighting, no glare or shadows</li>
                <li>✓ Personal data covered except photo and ID number</li>
                <li>✓ File size less than 10 MB each</li>
                <li>✓ JPEG, PNG, or WebP format</li>
              </ul>
            </div>

            <NIDUploadForm
              onSuccess={() => {
                // Component handles refresh after success
              }}
            />

            {/* Help Text */}
            <div className="mt-8 p-4 rounded-lg bg-gray-50 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Why we need your NID</h3>
              <p className="text-sm text-gray-600 mb-3">
                FreshMarket BD requires all sellers to verify their identity for trust and compliance.
                Your personal information is kept confidential and only used for verification purposes.
              </p>
              <p className="text-sm text-gray-600">
                During verification, our admin team will review your documents within 24 hours. You will
                receive an SMS notification when the process is complete.
              </p>
            </div>
          </div>
        )}

        {/* Already Approved */}
        {false && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-900">Verification Complete</h2>
            <p className="text-green-700 mt-2">
              Your NID has been verified! You can now create product listings and start selling.
            </p>
            <a
              href="/seller/create-listing"
              className="inline-block mt-4 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 transition"
            >
              Create Your First Listing
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
