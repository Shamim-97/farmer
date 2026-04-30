import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await createServerClient();

    // Verify admin
    const { data: profile, error: profileError } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get orders by status
    const { data: allOrders } = await client
      .from('orders')
      .select('status, total_amount, delivery_fee, created_at, village_id')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const ordersByStatus: Record<string, number> = {
      PENDING: 0,
      CONFIRMED: 0,
      READY: 0,
      COLLECTED: 0,
      ABANDONED: 0,
      CANCELLED: 0,
    };

    let totalRevenue = 0;
    let collectedCount = 0;

    (allOrders || []).forEach((order) => {
      ordersByStatus[order.status] += 1;
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
      [key: string]: { name: string; orders: number; revenue: number };
    } = {};

    for (const stat of villageStats || []) {
      const { data: village } = await client
        .from('villages')
        .select('name_en')
        .eq('id', stat.village_id)
        .single();

      if (!villageMap[stat.village_id]) {
        villageMap[stat.village_id] = {
          name: village?.name_en || 'Unknown',
          orders: 0,
          revenue: 0,
        };
      }
      villageMap[stat.village_id].orders += 1;
      villageMap[stat.village_id].revenue += stat.total_amount || 0;
    }

    // Get agents on duty
    const { count: agentsOnDuty } = await client
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

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
