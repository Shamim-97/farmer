'use server';

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { ok, err, type Result } from '@/lib/types/result';
import { AgentOrder, AgentEarnings } from '@/lib/types/pickup-agent';

interface AgentProfile {
  agent_id: string;
  name: string | null;
  phone: string;
  pickup_point: unknown;
}

/**
 * Get pickup agent profile
 */
export async function getPickupAgentProfile(): Promise<Result<AgentProfile>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: agent, error } = await client
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', user.id)
    .eq('role', 'PICKUP_AGENT')
    .single();

  if (error || !agent) return err('Pickup agent not found');

  const { data: point } = await client
    .from('pickup_points')
    .select('id, name, gps_lat, gps_lng, village_id')
    .eq('agent_id', user.id)
    .single();

  return ok({
    agent_id: agent.id,
    name: agent.full_name,
    phone: agent.phone,
    pickup_point: point,
  });
}

/**
 * Get orders ready for pickup at agent's point
 */
export async function getPickupPointOrders(
  pickupPointId: string
): Promise<Result<AgentOrder[]>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', pickupPointId)
    .single();

  if (pointError || point?.agent_id !== user.id) return err('Unauthorized');

  const { data: orders, error } = await client
    .from('orders')
    .select(
      `
        *,
        customer:customer_id (full_name, phone),
        product:product_id (name_en, category)
      `
    )
    .eq('pickup_point_id', pickupPointId)
    .eq('status', 'READY')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching orders:', error);
    return err('Failed to fetch orders');
  }

  return ok((orders ?? []) as unknown as AgentOrder[]);
}

/**
 * Mark order as collected with GPS + photo proof
 */
export async function collectOrder(
  orderId: string,
  gpsLat: number,
  gpsLng: number,
  photoPath: string
): Promise<Result<unknown>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, pickup_point_id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return err('Order not found');
  if (order.status !== 'READY') return err('Order is not ready for collection');

  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', order.pickup_point_id)
    .single();

  if (pointError || point?.agent_id !== user.id) return err('Unauthorized');

  const { data: updated, error: updateError } = await client
    .from('orders')
    .update({
      status: 'COLLECTED',
      collected_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .select()
    .single();

  if (updateError) {
    console.error('Update error:', updateError);
    return err('Failed to collect order');
  }

  const { error: proofError } = await client
    .from('collection_proofs')
    .insert({
      order_id: orderId,
      agent_id: user.id,
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      photo_url: photoPath,
      timestamp: new Date().toISOString(),
    });

  if (proofError) {
    console.error('Proof storage error:', proofError);
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: session } = await client
    .from('pickup_agent_sessions')
    .select('id')
    .eq('agent_id', user.id)
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`)
    .single();

  if (session) {
    const { count } = await client
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('pickup_point_id', order.pickup_point_id)
      .eq('status', 'COLLECTED')
      .gte('collected_at', `${today}T00:00:00`);

    await client
      .from('pickup_agent_sessions')
      .update({ orders_collected: count ?? 0 })
      .eq('id', session.id);
  }

  return ok(updated);
}

/**
 * Get agent's earnings for today/week/month
 */
export async function getAgentEarnings(): Promise<Result<AgentEarnings>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const { data: todayOrders, count: todayCount } = await client
    .from('orders')
    .select('delivery_fee', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${today}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  const typedTodayOrders = (todayOrders ?? []) as Array<{ delivery_fee: number | null }>;
  const todayEarnings =
    typedTodayOrders.reduce((sum, o) => sum + (o.delivery_fee ?? 0), 0) * 0.3;

  const { count: weekCount } = await client
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${weekAgo}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  const { count: monthCount } = await client
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${monthAgo}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  const { data: lastCollection } = await client
    .from('orders')
    .select('collected_at')
    .eq('status', 'COLLECTED')
    .order('collected_at', { ascending: false })
    .limit(1)
    .single();

  return ok({
    total_today: todayEarnings,
    collections_today: todayCount ?? 0,
    avg_per_order: todayCount
      ? Number((todayEarnings / todayCount).toFixed(2))
      : 0,
    total_week: weekCount ?? 0,
    total_month: monthCount ?? 0,
    last_collection: lastCollection?.collected_at,
  } as AgentEarnings);
}

/**
 * Start duty session
 */
export async function startDutySession(
  pickupPointId: string
): Promise<Result<unknown>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', pickupPointId)
    .single();

  if (pointError || point?.agent_id !== user.id) return err('Unauthorized');

  const { data: session, error } = await client
    .from('pickup_agent_sessions')
    .insert({
      agent_id: user.id,
      pickup_point_id: pickupPointId,
      status: 'ON_DUTY',
      start_time: new Date().toISOString(),
      orders_collected: 0,
      earnings: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Session creation error:', error);
    return err('Failed to start duty session');
  }

  return ok(session);
}

/**
 * End duty session
 */
export async function endDutySession(
  sessionId: string
): Promise<Result<unknown>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: session, error: sessionError } = await client
    .from('pickup_agent_sessions')
    .select('agent_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || session?.agent_id !== user.id) return err('Unauthorized');

  const { data: updated, error } = await client
    .from('pickup_agent_sessions')
    .update({
      status: 'OFF_DUTY',
      end_time: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    console.error('End session error:', error);
    return err('Failed to end duty session');
  }

  return ok(updated);
}

/**
 * Update agent GPS location
 */
export async function updateAgentLocation(
  sessionId: string,
  lat: number,
  lng: number
): Promise<Result<void>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: session, error: sessionError } = await client
    .from('pickup_agent_sessions')
    .select('agent_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || session?.agent_id !== user.id) return err('Unauthorized');

  const { error } = await client
    .from('pickup_agent_sessions')
    .update({ gps_lat: lat, gps_lng: lng })
    .eq('id', sessionId);

  if (error) {
    console.error('Location update error:', error);
    return err('Failed to update location');
  }

  return ok(undefined);
}
