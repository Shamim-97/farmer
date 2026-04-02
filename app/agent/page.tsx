'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, TrendingUp, Package } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { getPickupAgentProfile } from '@/lib/pickup-agent/actions';
import { AgentDashboard } from '@/components/pickup-agent/agent-dashboard';
import { AgentEarningsPanel } from '@/components/pickup-agent/agent-earnings';
import { PwaInitializer } from '@/components/pwa-initializer';

export default function PickupAgentPage() {
  const { user, profile } = useAuth();
  const [agentData, setAgentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'earnings'>('orders');

  useEffect(() => {
    if (!user) return;

    async function fetchAgent() {
      try {
        const result = await getPickupAgentProfile();
        if (result.success) {
          setAgentData(result.data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAgent();
  }, [user]);

  if (loading || !agentData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Loading agent dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PwaInitializer />

      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-md px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-600">Agent</p>
              <p className="font-bold text-slate-900">{agentData.name}</p>
            </div>
            <Link
              href="/api/auth/logout"
              className="rounded-lg p-2 hover:bg-slate-100"
            >
              <LogOut className="h-5 w-5 text-slate-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-14 z-40">
        <div className="mx-auto max-w-md px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 border-b-2 py-3 text-center text-sm font-medium transition-all ${
                activeTab === 'orders'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="mx-auto mb-1 h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
            </button>
            <button
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 border-b-2 py-3 text-center text-sm font-medium transition-all ${
                activeTab === 'earnings'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="mx-auto mb-1 h-4 w-4" />
              <span className="hidden sm:inline">Earnings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md">
        {activeTab === 'orders' && (
          <AgentDashboard
            pickupPointId={agentData.pickup_point?.id}
            agentId={agentData.agent_id}
          />
        )}

        {activeTab === 'earnings' && (
          <div className="py-4 px-4">
            <AgentEarningsPanel />
          </div>
        )}
      </div>

      {/* Install PWA Prompt */}
      <div className="fixed bottom-4 right-4 rounded-lg border border-slate-200 bg-white p-4 shadow-lg max-w-xs">
        <p className="text-sm font-semibold text-slate-900 mb-2">
          📲 Install App
        </p>
        <p className="text-xs text-slate-600 mb-3">
          Install FreshMarket on your home screen for offline access
        </p>
        <button className="w-full rounded-lg bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700">
          + Install
        </button>
      </div>
    </div>
  );
}
