'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Zap,
  Truck,
} from 'lucide-react';
import { AdminAnalytics } from '@/lib/types/admin';

interface AdminAnalyticsDashboardProps {
  analytics: AdminAnalytics | null;
  loading: boolean;
}

export default function AdminAnalyticsDashboard({
  analytics,
  loading,
}: AdminAnalyticsDashboardProps) {
  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-slate-600">Loading analytics...</p>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600">No analytics data available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-slate-600">Total Orders Today</p>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-900">{analytics.total_orders_today}</p>
          <p className="text-xs text-slate-600 mt-2">Across all status</p>
        </Card>

        {/* Total Revenue */}
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-slate-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-900">৳{analytics.total_revenue_today}</p>
          <p className="text-xs text-slate-600 mt-2">
            Avg: ৳{Math.round(analytics.avg_order_value)}
          </p>
        </Card>

        {/* Agents on Duty */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-slate-600">Agents on Duty</p>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-900">{analytics.agents_on_duty}</p>
          <p className="text-xs text-slate-600 mt-2">Active now</p>
        </Card>

        {/* Villages Reached */}
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm text-slate-600">Villages Reached</p>
            <Truck className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-900">{analytics.villages_reached}</p>
          <p className="text-xs text-slate-600 mt-2">Unique locations</p>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card className="p-6 bg-white">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Order Status Breakdown</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Pending */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <p className="text-sm text-orange-700 font-medium">Pending</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-orange-900">
                {analytics.pending_orders}
              </p>
              <p className="text-xs text-orange-700">
                {analytics.total_orders_today > 0
                  ? Math.round((analytics.pending_orders / analytics.total_orders_today) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Confirmed */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-700 font-medium">Confirmed</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-blue-900">
                {(analytics.orders_by_status?.CONFIRMED || 0)}
              </p>
              <p className="text-xs text-blue-700">
                {analytics.total_orders_today > 0
                  ? Math.round(
                      ((analytics.orders_by_status?.CONFIRMED || 0) / analytics.total_orders_today) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Ready */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <p className="text-sm text-yellow-700 font-medium">Ready</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-yellow-900">
                {analytics.ready_orders}
              </p>
              <p className="text-xs text-yellow-700">
                {analytics.total_orders_today > 0
                  ? Math.round((analytics.ready_orders / analytics.total_orders_today) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Collected */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <p className="text-sm text-green-700 font-medium">Collected</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-green-900">
                {analytics.collected_orders}
              </p>
              <p className="text-xs text-green-700">
                {analytics.total_orders_today > 0
                  ? Math.round((analytics.collected_orders / analytics.total_orders_today) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Abandoned */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-100">
            <p className="text-sm text-red-700 font-medium">Abandoned</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-red-900">
                {(analytics.abandoned_orders || 0)}
              </p>
              <p className="text-xs text-red-700">
                {analytics.total_orders_today > 0
                  ? Math.round(
                      ((analytics.abandoned_orders || 0) / analytics.total_orders_today) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>

          {/* Cancelled */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <p className="text-sm text-gray-700 font-medium">Cancelled</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-2xl font-bold text-gray-900">
                {(analytics.orders_by_status?.CANCELLED || 0)}
              </p>
              <p className="text-xs text-gray-700">
                {analytics.total_orders_today > 0
                  ? Math.round(
                      ((analytics.orders_by_status?.CANCELLED || 0) / analytics.total_orders_today) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Performing Agent */}
      {analytics.best_performing_agent && (
        <Card className="p-6 bg-white border-l-4 border-l-purple-600">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Best Performing Agent</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-slate-600">Agent Name</p>
              <p className="text-xl font-bold text-slate-900">
                {analytics.best_performing_agent.name}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Collections Today</p>
              <p className="text-xl font-bold text-green-600">
                {analytics.best_performing_agent.collections}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Earnings Today</p>
              <p className="text-xl font-bold text-blue-600">
                ৳{analytics.best_performing_agent.earnings}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Village Performance */}
      {analytics.orders_by_village && analytics.orders_by_village.length > 0 && (
        <Card className="p-6 bg-white">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">Village Performance</h3>
          </div>

          <div className="space-y-3">
            {analytics.orders_by_village.slice(0, 5).map((village, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{village.village}</p>
                  <p className="text-xs text-slate-600">
                    {village.orders} orders • Revenue: ৳{village.revenue}
                  </p>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{village.orders}</Badge>
              </div>
            ))}
          </div>

          {analytics.orders_by_village.length > 5 && (
            <p className="text-xs text-slate-500 mt-4 text-center">
              +{analytics.orders_by_village.length - 5} more villages
            </p>
          )}
        </Card>
      )}

      {/* Chart Placeholder */}
      <Card className="p-8 bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-dashed border-slate-200 text-center">
        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
        <p className="text-slate-600 mb-2">Visual Charts Coming Soon</p>
        <p className="text-sm text-slate-500">
          Hourly order trends, revenue breakdown, and detailed analytics charts
        </p>
      </Card>
    </div>
  );
}
