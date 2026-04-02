import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from '@/lib/auth/helpers';
import {
  AdminNIDApprovalDashboard,
  AdminRejectedNIDsHistory,
} from '@/components/nid/admin-nid-panel';

/**
 * /admin/nid-approvals
 * Admin dashboard for reviewing and approving seller NID submissions
 */
export default async function AdminNIDApprovalsPage() {
  const profile = await getCurrentUserProfile();

  // Redirect if not authenticated
  if (!profile) {
    redirect('/auth/signin');
  }

  // Redirect if not admin
  if (profile.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">NID Verification Management</h1>
          <p className="mt-1 text-gray-600">Review and approve seller identity documents</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Pending Approvals (Main) */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <AdminNIDApprovalDashboard />
            </div>
          </div>

          {/* Sidebar: Rejected NIDs */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">—</p>
                  <p className="text-xs text-gray-600 mt-1">Waiting for approval</p>
                </div>
                <hr />
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Approved This Month</p>
                  <p className="text-2xl font-bold text-green-600">—</p>
                  <p className="text-xs text-gray-600 mt-1">Verified sellers</p>
                </div>
              </div>
            </div>

            {/* Recent Rejections */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Rejections</h3>
              <AdminRejectedNIDsHistory />
            </div>

            {/* Guidelines */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Approval Guidelines</h3>
              <ul className="text-xs text-blue-800 space-y-2">
                <li>✓ Check photo clarity and completeness</li>
                <li>✓ Verify ID number is visible</li>
                <li>✓ Confirm identity matches seller profile</li>
                <li>✓ Ensure photos are recent</li>
                <li>✓ Check for any signs of forgery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
