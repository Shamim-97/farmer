'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Package,
  Users,
  BarChart3,
  Map,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import AdminOrderList from '@/components/admin/order-list';
import AdminAgentMap from '@/components/admin/agent-map';
import AdminAnalyticsDashboard from '@/components/admin/analytics-dashboard';
import AdminCollectionGallery from '@/components/admin/collection-gallery';
import { useAdminAnalytics } from '@/lib/admin/hooks';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
  const { analytics, loading: analyticsLoading, error: analyticsError, refetch } = useAdminAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              Live Admin Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Real-time order tracking & analytics</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
            {analyticsLoading ? (
              <div className="flex items-center gap-2 text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Error loading stats</span>
              </div>
            ) : (
              <>
                <Card className="bg-white px-3 py-2 md:px-4 md:py-3">
                  <div className="text-xs text-slate-600">Pending Orders</div>
                  <div className="text-lg md:text-2xl font-bold text-orange-600">
                    {analytics?.pending_orders || 0}
                  </div>
                </Card>
                <Card className="bg-white px-3 py-2 md:px-4 md:py-3">
                  <div className="text-xs text-slate-600">Ready for Pickup</div>
                  <div className="text-lg md:text-2xl font-bold text-blue-600">
                    {analytics?.ready_orders || 0}
                  </div>
                </Card>
                <Card className="bg-white px-3 py-2 md:px-4 md:py-3">
                  <div className="text-xs text-slate-600">Collected Today</div>
                  <div className="text-lg md:text-2xl font-bold text-green-600">
                    {analytics?.collected_orders || 0}
                  </div>
                </Card>
                <Card className="bg-white px-3 py-2 md:px-4 md:py-3">
                  <div className="text-xs text-slate-600">Agents on Duty</div>
                  <div className="text-lg md:text-2xl font-bold text-purple-600">
                    {analytics?.agents_on_duty || 0}
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-sm p-1">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Heatmap</span>
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <AdminOrderList />
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <AdminAgentMap />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AdminAnalyticsDashboard analytics={analytics} loading={analyticsLoading} />
        </TabsContent>

        {/* Heatmap Tab */}
        <TabsContent value="map" className="space-y-4">
          <AdminCollectionGallery />
        </TabsContent>
      </Tabs>
    </div>
  );
}
