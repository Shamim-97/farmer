'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Package, DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { getPickupPointOrders, startDutySession } from '@/lib/pickup-agent/actions';
import { AgentOrder } from '@/lib/types/pickup-agent';
import OrderCollectionCard from './order-collection-card';

interface AgentDashboardProps {
  pickupPointId: string;
  agentId: string;
}

export function AgentDashboard({ pickupPointId, agentId }: AgentDashboardProps) {
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);

  // Fetch orders on mount
  useEffect(() => {
    async function fetchOrders() {
      try {
        const result = await getPickupPointOrders(pickupPointId);
        if (result.success) {
          setOrders(result.data || []);
        } else {
          setError(result.error || 'Failed to fetch orders');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    }

    // Check if session already active in localStorage
    const activeSession = localStorage.getItem('agent-session');
    if (activeSession) {
      setSessionActive(true);
    }

    fetchOrders();

    // Refresh orders every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [pickupPointId]);

  const handleStartSession = async () => {
    setSessionStarting(true);
    try {
      const result = await startDutySession(pickupPointId);
      if (result.success) {
        localStorage.setItem('agent-session', JSON.stringify(result.data));
        setSessionActive(true);
        setError(null);
      } else {
        setError(result.error || 'Failed to start session');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred');
    } finally {
      setSessionStarting(false);
    }
  };

  const handleOrderCollected = (orderId: string) => {
    setOrders(orders.filter((o) => o.id !== orderId));
    setCollectedCount(collectedCount + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-slate-50 py-4">
        <div className="mx-auto max-w-md px-4">
          <div className="space-y-6 pt-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900">Start Duty</h1>
              <p className="mt-2 text-slate-600">
                Begin your pickup agent shift to start collecting orders
              </p>
            </div>

            <button
              onClick={handleStartSession}
              disabled={sessionStarting}
              className="w-full rounded-lg bg-green-600 py-4 font-semibold text-white transition-all hover:bg-green-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              {sessionStarting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Starting...
                </>
              ) : (
                '  ✓ Start Duty Session'
              )}
            </button>

            <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900">📍 How to Use</h3>
              <ul className="space-y-2 text-xs text-blue-800">
                <li>• Click "Start Duty" to begin your shift</li>
                <li>• View all READY orders at your pickup point</li>
                <li>• Collect each order using the photo proof feature</li>
                <li>• GPS location is recorded for each collection</li>
                <li>• Earn commission on each collected order</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4">
      <div className="mx-auto max-w-md space-y-4 px-4">
        {/* Header */}
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Today's Orders</h1>
            <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
              <span className="text-xs font-semibold text-green-700">On Duty</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
            <div>
              <p className="text-xs text-slate-600">Ready</p>
              <p className="text-xl font-bold text-slate-900">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Collected</p>
              <p className="text-xl font-bold text-green-600">{collectedCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-600">Total Today</p>
              <p className="text-xl font-bold text-slate-900">
                {orders.length + collectedCount}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* No Orders */}
        {orders.length === 0 && (
          <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-6 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-900">No Orders Yet</h2>
            <p className="text-sm text-slate-600">
              All orders will appear here when they're ready for pickup
            </p>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCollectionCard
              key={order.id}
              order={order}
              onCollected={() => handleOrderCollected(order.id)}
            />
          ))}
        </div>

        {/* Offline Indicator */}
        <div className="fixed bottom-4 left-4 right-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 max-w-md mx-auto">
          <p>📡 Offline mode available - Photos will sync when connection restored</p>
        </div>
      </div>
    </div>
  );
}
