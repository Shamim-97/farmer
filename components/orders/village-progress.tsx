'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { VillageThresholdInfo } from '@/lib/types/order';

interface VillageProgressProps {
  villageId: string;
  className?: string;
  showMessage?: boolean;
}

export function VillageProgress({
  villageId,
  className = '',
  showMessage = true,
}: VillageProgressProps) {
  const [progress, setProgress] = useState<VillageThresholdInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const client = createBrowserClient();

  // Fetch initial data
  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(
          `/api/village-threshold?village_id=${villageId}`
        );
        const data = await response.json();
        if (data.success) {
          setProgress(data.data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Failed to fetch village progress:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [villageId]);

  // Subscribe to Realtime updates
  useEffect(() => {
    const subscription = client
      .from('villages')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'villages',
          filter: `id=eq.${villageId}`,
        },
        (payload) => {
          const updated = payload.new;
          setProgress({
            village_name: updated.name_en,
            current_kg: updated.current_total_kg,
            threshold_kg: updated.min_threshold_kg,
            percentage: Math.min(
              100,
              Math.round((updated.current_total_kg / updated.min_threshold_kg) * 100)
            ),
            kg_remaining: Math.max(0, updated.min_threshold_kg - updated.current_total_kg),
            delivery_fee: updated.delivery_fee,
            is_free: updated.current_total_kg >= updated.min_threshold_kg,
          });
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Refresh every 30 seconds as fallback
    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/village-threshold?village_id=${villageId}`
        );
        const data = await response.json();
        if (data.success) {
          setProgress(data.data);
          setLastUpdate(new Date());
        }
      } catch (err) {
        console.error('Refresh failed:', err);
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [villageId, client]);

  if (loading || !progress) {
    return (
      <div
        className={`flex items-center justify-center gap-2 rounded-lg bg-slate-100 p-3 ${className}`}
      >
        <Activity className="h-4 w-4 animate-spin text-slate-500" />
        <span className="text-sm text-slate-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-slate-700">Village Threshold</span>
        </div>
        <span className="text-xs text-slate-500">
          {progress.percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full transition-all duration-300 ${
            progress.is_free ? 'bg-green-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-slate-600">Current</span>
          <span className="font-semibold text-slate-900">{progress.current_kg} kg</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-600">Threshold</span>
          <span className="font-semibold text-slate-900">{progress.threshold_kg} kg</span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-600">Remaining</span>
          <span className="font-semibold text-slate-900">{progress.kg_remaining} kg</span>
        </div>
      </div>

      {/* Message */}
      {showMessage && (
        <div
          className={`rounded-md p-2 text-xs font-medium ${
            progress.is_free
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {progress.is_free
            ? `🎉 Free pickup! Village reached ${progress.threshold_kg} kg threshold.`
            : `${progress.kg_remaining} kg more for free pickup!`}
        </div>
      )}

      {/* Last Update */}
      <div className="text-xs text-slate-500">
        Last updated: {lastUpdate?.toLocaleTimeString() || 'never'}
      </div>
    </div>
  );
}

/**
 * Delivery Fee Preview Component
 */
interface DeliveryFeePreviewProps {
  villageId: string;
  projectedKg: number;
  onFeeChange?: (fee: number) => void;
}

export function DeliveryFeePreview({
  villageId,
  projectedKg,
  onFeeChange,
}: DeliveryFeePreviewProps) {
  const [progress, setProgress] = useState<VillageThresholdInfo | null>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const response = await fetch(
          `/api/village-threshold?village_id=${villageId}`
        );
        const data = await response.json();
        if (data.success) {
          setProgress(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      }
    }

    fetchProgress();
  }, [villageId]);

  if (!progress) {
    return null;
  }

  const newTotal = progress.current_kg + projectedKg;
  const wouldBeFree = newTotal >= progress.threshold_kg;
  const deliveryFee = wouldBeFree ? 0 : progress.delivery_fee;

  // Notify parent of fee change
  useEffect(() => {
    onFeeChange?.(deliveryFee);
  }, [deliveryFee, onFeeChange]);

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Delivery Fee</span>
        <span className="text-xs text-slate-600">
          {wouldBeFree ? '✓ Free' : `৳${deliveryFee}`}
        </span>
      </div>
      {wouldBeFree && (
        <div className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-1">
          <span className="text-xs font-semibold text-green-700">FREE!</span>
        </div>
      )}
    </div>
  );
}
