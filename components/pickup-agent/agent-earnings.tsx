'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Target, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { getAgentEarnings } from '@/lib/pickup-agent/actions';
import { AgentEarnings } from '@/lib/types/pickup-agent';

export function AgentEarningsPanel() {
  const [earnings, setEarnings] = useState<AgentEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const result = await getAgentEarnings();
        if (result.success) {
          setEarnings(result.data || null);
        } else {
          setError(result.error || 'Failed to fetch earnings');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();

    // Refresh every 60 seconds
    const interval = setInterval(fetchEarnings, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading earnings...</span>
        </div>
      </div>
    );
  }

  if (error || !earnings) {
    return (
      <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
        <p className="text-sm text-red-700">{error || 'Failed to load earnings'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Today's Earnings - Large Card */}
      <div className="rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-green-700">Today's Earnings</p>
            <p className="text-4xl font-bold text-green-600 mt-2">
              ৳{earnings.total_today.toFixed(0)}
            </p>
            <p className="text-xs text-green-600 mt-2">
              {earnings.collections_today} collections
            </p>
          </div>
          <TrendingUp className="h-12 w-12 text-green-600 opacity-20" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Avg Per Order */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <p className="text-xs text-slate-600">Avg per Order</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ৳{earnings.avg_per_order}
          </p>
        </div>

        {/* Week Total */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <p className="text-xs text-slate-600">This Week</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {earnings.total_week}
          </p>
          <p className="text-xs text-slate-500 mt-1">collections</p>
        </div>

        {/* Month Total */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            <p className="text-xs text-slate-600">This Month</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {earnings.total_month}
          </p>
          <p className="text-xs text-slate-500 mt-1">collections</p>
        </div>

        {/* Last Collection */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-slate-600" />
            <p className="text-xs text-slate-600">Last Collection</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {earnings.last_collection
              ? new Date(earnings.last_collection).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'No collections'}
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-semibold text-blue-900">💰 Earnings Info</p>
        <ol className="mt-2 space-y-1 text-xs text-blue-800">
          <li>• You earn 30% commission on delivery fees</li>
          <li>• Free pickups = no commission earned</li>
          <li>• Earnings calculated daily at midnight</li>
          <li>• Withdraw earnings every Friday</li>
        </ol>
      </div>
    </div>
  );
}
