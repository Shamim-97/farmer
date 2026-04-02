import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile, canCreateListing } from '@/lib/auth/helpers';
import { NIDStatusBanner } from '@/components/nid/nid-verification';
import { CreateListingForm } from '@/components/products/create-listing-form';

/**
 * /seller/create-listing
 * Page for sellers to create new product listings
 * RULE 2: NID GATE - blocked unless nid_status = 'APPROVED'
 */
export default async function CreateListingPage() {
  const profile = await getCurrentUserProfile();

  // Redirect if not authenticated
  if (!profile) {
    redirect('/auth/signin');
  }

  // Redirect if not a seller
  if (profile.role !== 'SELLER') {
    redirect('/dashboard');
  }

  // Check NID gate
  const { allowed, nidStatus, reason } = await canCreateListing();

  if (!allowed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Product Listing</h1>
            <p className="mt-2 text-gray-600">পণ্য তালিকা তৈরি করুন</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          {nidStatus === 'PENDING' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                <svg
                  className="w-8 h-8 text-amber-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-amber-900">Under Review</h2>
              <p className="text-amber-700 mt-2">{reason}</p>
              <p className="text-sm text-amber-600 mt-4">
                আমরা আপনার NID পর্যালোচনা করছি। শীঘ্রই আপডেট পাবেন।
              </p>
            </div>
          )}

          {nidStatus === 'REJECTED' && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-900">Verification Failed</h2>
              <p className="text-red-700 mt-2">{reason}</p>

              <div className="mt-6 p-4 rounded-lg bg-white border border-red-200">
                <p className="text-sm font-medium text-red-900 mb-3">
                  আপনার NID যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করার জন্য:
                </p>
                <a
                  href="/seller/nid-verification"
                  className="inline-block rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 transition"
                >
                  Resubmit NID
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // NID is approved - show form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Product Listing</h1>
          <p className="mt-2 text-gray-600">
            Sell your fresh products to customers in your village
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* NID Status Banner */}
        <div className="mb-8">
          <NIDStatusBanner />
        </div>

        {/* Form Container */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <CreateListingForm sellerId={profile.id} />
        </div>
      </div>
    </div>
  );
}
