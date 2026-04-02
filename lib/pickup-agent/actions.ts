'use server';

import { createServerClient, supabaseAdmin } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import { AgentOrder, AgentEarnings, PickupAgentSession } from '@/lib/types/pickup-agent';

/**
 * Get pickup agent profile
 */
export async function getPickupAgentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  const { data: agent, error } = await client
    .from('profiles')
    .select('id, full_name, phone')
    .eq('id', user.id)
    .eq('role', 'PICKUP_AGENT')
    .single();

  if (error || !agent) {
    return { success: false, error: 'Pickup agent not found' };
  }

  // Get assigned pickup point
  const { data: point } = await client
    .from('pickup_points')
    .select('id, name, gps_lat, gps_lng, village_id')
    .eq('agent_id', user.id)
    .single();

  return {
    success: true,
    data: {
      agent_id: agent.id,
      name: agent.full_name,
      phone: agent.phone,
      pickup_point: point,
    },
  };
}

/**
 * Get orders ready for pickup at agent's point
 */
export async function getPickupPointOrders(pickupPointId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  // Verify agent is assigned to this pickup point
  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', pickupPointId)
    .single();

  if (pointError || point?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Get READY orders for this pickup point
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
    return { success: false, error: 'Failed to fetch orders' };
  }

  return {
    success: true,
    data: (orders || []) as AgentOrder[],
  };
}

/**
 * Mark order as collected with GPS + photo proof
 */
export async function collectOrder(
  orderId: string,
  gpsLat: number,
  gpsLng: number,
  photoPath: string // path to uploaded photo in storage
) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  // Get order to verify status
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, pickup_point_id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.status !== 'READY') {
    return { success: false, error: 'Order is not ready for collection' };
  }

  // Verify agent is assigned to pickup point
  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', order.pickup_point_id)
    .single();

  if (pointError || point?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Update order status
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
    return { success: false, error: 'Failed to collect order' };
  }

  // Store collection proof
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
    // Still return success as order was collected
  }

  // Update agent's session statistics
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const { data: session } = await client
    .from('pickup_agent_sessions')
    .select('id')
    .eq('agent_id', user.id)
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`)
    .single();

  if (session) {
    await client
      .from('pickup_agent_sessions')
      .update({
        orders_collected: (await client
          .from('orders')
          .select('id', { count: 'exact' })
          .eq('pickup_point_id', order.pickup_point_id)
          .eq('status', 'COLLECTED')
          .gte('collected_at', `${today}T00:00:00`)).count || 0,
      })
      .eq('id', session.id);
  }

  return {
    success: true,
    data: updated,
    message: 'Order collected successfully',
  };
}

/**
 * Get agent's earnings for today/week/month
 */
export async function getAgentEarnings(): Promise<{
  success: boolean;
  error?: string;
  data?: AgentEarnings;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  // Get today's collections
  const { data: todayOrders, count: todayCount } = await client
    .from('orders')
    .select('delivery_fee', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${today}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  const todayEarnings =
    (todayOrders?.reduce((sum, o) => sum + (o.delivery_fee || 0), 0) || 0) *
    0.3; // Agent gets 30% of delivery fee

  // Get week's collections
  const { count: weekCount } = await client
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${weekAgo}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  // Get month's collections
  const { count: monthCount } = await client
    .from('orders')
    .select('id', { count: 'exact' })
    .eq('status', 'COLLECTED')
    .gte('collected_at', `${monthAgo}T00:00:00`)
    .lte('collected_at', `${today}T23:59:59`);

  // Get last collection
  const { data: lastCollection } = await client
    .from('orders')
    .select('collected_at')
    .eq('status', 'COLLECTED')
    .order('collected_at', { ascending: false })
    .limit(1)
    .single();

  return {
    success: true,
    data: {
      total_today: todayEarnings,
      collections_today: todayCount || 0,
      avg_per_order: todayCount ? (todayEarnings / todayCount).toFixed(2) : '0',
      total_week: weekCount || 0,
      total_month: monthCount || 0,
      last_collection: lastCollection?.collected_at,
    },
  };
}

/**
 * Start duty session
 */
export async function startDutySession(pickupPointId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  // Verify agent is assigned to this pickup point
  const { data: point, error: pointError } = await client
    .from('pickup_points')
    .select('agent_id')
    .eq('id', pickupPointId)
    .single();

  if (pointError || point?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  // Create session
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
    return { success: false, error: 'Failed to start duty session' };
  }

  return { success: true, data: session };
}

/**
 * End duty session
 */
export async function endDutySession(sessionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  const { data: session, error: sessionError } = await client
    .from('pickup_agent_sessions')
    .select('agent_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || session?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

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
    return { success: false, error: 'Failed to end duty session' };
  }

  return { success: true, data: updated };
}

/**
 * Update agent GPS location
 */
export async function updateAgentLocation(
  sessionId: string,
  lat: number,
  lng: number
) {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const client = await createServerClient();

  const { data: session, error: sessionError } = await client
    .from('pickup_agent_sessions')
    .select('agent_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || session?.agent_id !== user.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await client
    .from('pickup_agent_sessions')
    .update({
      gps_lat: lat,
      gps_lng: lng,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Location update error:', error);
    return { success: false, error: 'Failed to update location' };
  }

  return { success: true };
}
