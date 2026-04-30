'use server';

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import {
  AdminOrderView,
  AdminAgentView,
  AdminAnalytics,
  AdminOrderDetail,
  HeatmapDataPoint,
} from '@/lib/types/admin';
import type {
  OrderWithJoins,
  AgentWithPickupPoint,
  AgentSession,
} from '@/lib/types/db-views';
import type { OrderRow } from '@/lib/supabase/database.types';
import {
  ok,
  err,
  okPaginated,
  type Result,
  type PaginatedResult,
} from '@/lib/types/result';

/**
 * Get ALL orders with real-time status (admin only)
 */
export async function getAdminOrders(
  limit = 100,
  offset = 0,
  filter?: { status?: string; village_id?: string }
): Promise<PaginatedResult<AdminOrderView[]>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  let query = client
    .from('orders')
    .select(
      `
        id,
        customer_id,
        seller_id,
        product_id,
        pickup_point_id,
        village_id,
        quantity_kg,
        total_amount,
        delivery_fee,
        status,
        payment_status,
        pickup_date,
        created_at,
        updated_at,
        customer:customer_id (full_name, phone),
        seller:seller_id (full_name, phone),
        product:product_id (name_en),
        village:village_id (name_en),
        pickup_point:pickup_point_id (name, gps_lat, gps_lng)
      `,
      { count: 'exact' }
    );

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  if (filter?.village_id) {
    query = query.eq('village_id', filter.village_id);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching orders:', error);
    return err('Failed to fetch orders');
  }

  const rows = (data ?? []) as unknown as OrderWithJoins[];
  const formattedOrders: AdminOrderView[] = rows.map((o) => ({
    id: o.id,
    order_id: o.id,
    customer_name: o.customer?.full_name ?? 'Unknown',
    customer_phone: o.customer?.phone ?? 'N/A',
    product_name: o.product?.name_en ?? 'Product',
    quantity_kg: o.quantity_kg,
    total_amount: o.total_amount,
    status: o.status,
    payment_status: o.payment_status,
    pickup_point: o.pickup_point?.name ?? 'Unknown',
    village_name: o.village?.name_en ?? 'Unknown',
    seller_name: o.seller?.full_name ?? 'Unknown',
    created_at: o.created_at,
    updated_at: o.updated_at,
  }));

  return okPaginated(formattedOrders, count ?? 0);
}

/**
 * Get detailed order information with collection proof
 */
export async function getAdminOrderDetail(
  orderId: string
): Promise<Result<AdminOrderDetail>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const { data: order, error } = await client
    .from('orders')
    .select(
      `
        *,
        customer:customer_id (full_name, phone),
        seller:seller_id (full_name, phone, nid_status),
        product:product_id (name_en, category),
        village:village_id (name_en, gps_lat, gps_lng),
        pickup_point:pickup_point_id (name, gps_lat, gps_lng)
      `
    )
    .eq('id', orderId)
    .single();

  if (error || !order) return err('Order not found');

  const { data: proof } = await client
    .from('collection_proofs')
    .select('photo_url, gps_lat, gps_lng, timestamp')
    .eq('order_id', orderId)
    .single();

  const o = order as any;
  return ok({
    id: o.id,
    order_id: o.id,
    customer_name: o.customer?.full_name,
    customer_phone: o.customer?.phone,
    product_name: o.product?.name_en,
    quantity_kg: o.quantity_kg,
    total_amount: o.total_amount,
    status: o.status,
    payment_status: o.payment_status,
    pickup_point: o.pickup_point?.name,
    village_name: o.village?.name_en,
    seller_name: o.seller?.full_name,
    seller_phone: o.seller?.phone,
    seller_nid_status: o.seller?.nid_status,
    location_details: {
      pickup_point_lat: o.pickup_point?.gps_lat,
      pickup_point_lng: o.pickup_point?.gps_lng,
      village_lat: o.village?.gps_lat,
      village_lng: o.village?.gps_lng,
    },
    collection_proof: proof
      ? {
          photo_url: proof.photo_url,
          gps_lat: proof.gps_lat,
          gps_lng: proof.gps_lng,
          collected_at: proof.timestamp,
        }
      : null,
    created_at: o.created_at,
    updated_at: o.updated_at,
  } as AdminOrderDetail);
}

/**
 * Get all active agents with real-time status
 */
export async function getAdminAgents(): Promise<Result<AdminAgentView[]>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const { data: agents, error } = await client
    .from('profiles')
    .select(
      `
        id,
        full_name,
        phone,
        pickup_points:pickup_point_id (name, id)
      `
    )
    .eq('role', 'PICKUP_AGENT');

  if (error) {
    console.error('Error fetching agents:', error);
    return err('Failed to fetch agents');
  }

  // Get agent sessions and statistics
  const today = new Date().toISOString().split('T')[0];

  const typedAgents = (agents ?? []) as unknown as AgentWithPickupPoint[];
  const agentViews: AdminAgentView[] = await Promise.all(
    typedAgents.map(async (agent) => {
      const { data: sessionRaw } = await client
        .from('pickup_agent_sessions')
        .select('*')
        .eq('agent_id', agent.id)
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();
      const session = sessionRaw as AgentSession | null;

      const { data: stats } = await client
        .from('collection_proofs')
        .select('id')
        .eq('agent_id', agent.id)
        .gte('timestamp', `${today}T00:00:00`)
        .lte('timestamp', `${today}T23:59:59`);

      return {
        id: agent.id,
        name: agent.full_name ?? 'Unknown',
        phone: agent.phone,
        pickup_point: agent.pickup_points?.[0]?.name ?? 'Unassigned',
        status: (session?.status ?? 'OFF_DUTY') as AdminAgentView['status'],
        current_session: session
          ? {
              started_at: session.start_time,
              orders_collected: session.orders_collected,
              earnings: session.earnings,
              gps_lat: session.gps_lat ?? undefined,
              gps_lng: session.gps_lng ?? undefined,
            }
          : undefined,
        today_stats: {
          orders_collected: stats?.length ?? 0,
          earnings: (stats?.length ?? 0) * 50, // Placeholder
          collections_count: stats?.length ?? 0,
        },
      };
    })
  );

  return ok(agentViews);
}

/**
 * Get comprehensive admin analytics
 */
export async function getAdminAnalytics(): Promise<Result<AdminAnalytics>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const today = new Date().toISOString().split('T')[0];

  // Get orders by status
  const { data: allOrders } = await client
    .from('orders')
    .select('status, total_amount, delivery_fee, created_at, village_id')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const ordersByStatus = {
    PENDING: 0,
    CONFIRMED: 0,
    READY: 0,
    COLLECTED: 0,
    ABANDONED: 0,
    CANCELLED: 0,
  };

  let totalRevenue = 0;
  let collectedCount = 0;

  type OrderStatusRow = Pick<OrderRow, 'status' | 'total_amount'>;
  ((allOrders ?? []) as unknown as OrderStatusRow[]).forEach((order) => {
    ordersByStatus[order.status as keyof typeof ordersByStatus] += 1;
    totalRevenue += order.total_amount || 0;
    if (order.status === 'COLLECTED') {
      collectedCount += 1;
    }
  });

  // Get village breakdown
  const { data: villageStats } = await client
    .from('orders')
    .select('village_id, total_amount')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);

  const villageMap: {
    [key: string]: { village: string; orders: number; revenue: number };
  } = {};

  for (const stat of villageStats || []) {
    const { data: village } = await client
      .from('villages')
      .select('name_en')
      .eq('id', stat.village_id)
      .single();

    if (!villageMap[stat.village_id]) {
      villageMap[stat.village_id] = {
        village: village?.name_en || 'Unknown',
        orders: 0,
        revenue: 0,
      };
    }
    villageMap[stat.village_id].orders += 1;
    villageMap[stat.village_id].revenue += stat.total_amount || 0;
  }

  // Get agents on duty
  const { data: activeSessions, count: agentsOnDuty } = await client
    .from('pickup_agent_sessions')
    .select('*', { count: 'exact' })
    .eq('status', 'ON_DUTY')
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`);

  // Get best performing agent
  const { data: topCollections } = await client
    .from('collection_proofs')
    .select('agent_id')
    .gte('timestamp', `${today}T00:00:00`)
    .lte('timestamp', `${today}T23:59:59`);

  let bestAgent: { name: string; collections: number; earnings: number } | undefined;
  if (topCollections && topCollections.length > 0) {
    const agentCounts = topCollections.reduce(
      (acc, proof) => {
        acc[proof.agent_id] = (acc[proof.agent_id] || 0) + 1;
        return acc;
      },
      {} as { [key: string]: number }
    );

    const topAgentId = Object.entries(agentCounts).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0];

    if (topAgentId) {
      const { data: agent } = await client
        .from('profiles')
        .select('full_name')
        .eq('id', topAgentId)
        .single();

      bestAgent = {
        name: agent?.full_name || 'Unknown',
        collections: agentCounts[topAgentId],
        earnings: agentCounts[topAgentId] * 50, // Placeholder calculation
      };
    }
  }

  return ok({
    total_orders_today: allOrders?.length || 0,
    pending_orders: ordersByStatus.PENDING,
    ready_orders: ordersByStatus.READY,
    collected_orders: ordersByStatus.COLLECTED,
    abandoned_orders: ordersByStatus.ABANDONED,
    total_revenue_today: totalRevenue,
    avg_order_value: allOrders?.length ? totalRevenue / allOrders.length : 0,
    delivery_fee_collected: 0,
    agents_on_duty: agentsOnDuty || 0,
    avg_collection_time_minutes: 15,
    villages_reached: Object.keys(villageMap).length,
    best_performing_agent: bestAgent,
    orders_by_status: ordersByStatus,
    orders_by_village: Object.values(villageMap),
    hourly_orders: [],
  } as AdminAnalytics);
}

/**
 * Get heatmap data for villages
 */
export async function getHeatmapData(): Promise<Result<HeatmapDataPoint[]>> {
  const user = await getCurrentUser();
  if (!user) return err('Not authenticated');

  const client = await createServerClient();

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'ADMIN') {
    return err('Admin access required');
  }

  const { data: villages } = await client
    .from('villages')
    .select('id, name_en, gps_lat, gps_lng');

  if (!villages) return ok([] as HeatmapDataPoint[]);

  const typedVillages = villages as unknown as Array<{
    id: string;
    name_en: string;
    gps_lat: number;
    gps_lng: number;
  }>;

  const heatmapData = await Promise.all(
    typedVillages.map(async (village) => {
      const { data: orders, count } = await client
        .from('orders')
        .select('total_amount', { count: 'exact' })
        .eq('village_id', village.id)
        .eq('status', 'COLLECTED');

      const typedOrders = (orders ?? []) as Array<{ total_amount: number }>;
      const revenue = typedOrders.reduce(
        (sum, o) => sum + (o.total_amount || 0),
        0
      );
      const intensity = Math.min(1, (count || 0) / 100);

      return {
        village: village.name_en,
        lat: village.gps_lat,
        lng: village.gps_lng,
        orders_count: count || 0,
        intensity,
        revenue,
      } as HeatmapDataPoint;
    })
  );

  return ok(heatmapData);
}
