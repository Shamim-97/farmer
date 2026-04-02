'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { RealtimeOrderEvent } from '@/lib/types/admin';

/**
 * Subscribe to real-time order updates for admin dashboard
 */
export function useAdminOrderUpdates(
  onOrderUpdate: (eventType: RealtimeOrderEvent, payload: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = createBrowserClient();

    const subscription = client
      .channel('admin_orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          let eventType: RealtimeOrderEvent = 'ORDER_CREATED';
          if (payload.eventType === 'INSERT') eventType = 'ORDER_CREATED';
          else if (payload.new.status === 'CONFIRMED') eventType = 'ORDER_CONFIRMED';
          else if (payload.new.status === 'READY') eventType = 'ORDER_READY';
          else if (payload.new.status === 'COLLECTED') eventType = 'ORDER_COLLECTED';
          else if (payload.new.status === 'ABANDONED') eventType = 'ORDER_ABANDONED';

          onOrderUpdate(eventType, payload.new);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [onOrderUpdate]);

  return { isConnected };
}

/**
 * Subscribe to real-time agent location updates
 */
export function useAdminAgentUpdates(
  onAgentUpdate: (agentId: string, location: { lat: number; lng: number }) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = createBrowserClient();

    const subscription = client
      .channel('admin_agents')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pickup_agent_sessions',
        },
        (payload) => {
          onAgentUpdate(payload.new.agent_id, {
            lat: payload.new.gps_lat,
            lng: payload.new.gps_lng,
          });
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [onAgentUpdate]);

  return { isConnected };
}

/**
 * Subscribe to collection proof updates
 */
export function useAdminCollectionUpdates(
  onCollectionUpdate: (orderId: string, proofUrl: string) => void
) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = createBrowserClient();

    const subscription = client
      .channel('admin_collections')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'collection_proofs',
        },
        (payload) => {
          onCollectionUpdate(payload.new.order_id, payload.new.photo_url);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      subscription.unsubscribe();
    };
  }, [onCollectionUpdate]);

  return { isConnected };
}

/**
 * Use real-time admin analytics with periodic refresh
 */
export function useAdminAnalytics(refreshInterval = 30000) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalytics, refreshInterval]);

  return { analytics, loading, error, refetch: fetchAnalytics };
}
