/**
 * Cron Jobs for FreshMarket BD
 * 
 * These functions run on schedules via Edge Functions or external cron service
 * Call these via POST from a cron service like Vercel, EasyCron, or AWS EventBridge
 */

import { createServerClient } from '@/lib/supabase/server';
import { isPlaceholderEnv } from '@/lib/env';
import {
  notifyOrderStatusChange,
  notifyAgentEarnings,
} from '@/lib/notifications/actions';

const SKIP_RESULT = {
  success: false,
  error: 'Supabase not configured; cron skipped',
};

/**
 * CRON: Every 1 hour
 * Mark orders as ABANDONED if PENDING/CONFIRMED for > 24 hours
 */
export async function abandonedOrderCleanup() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Find orders in PENDING/CONFIRMED for > 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: abandonedOrders, error: fetchError } = await client
      .from('orders')
      .select('id, customer_id, village_id, quantity_kg')
      .in('status', ['PENDING', 'CONFIRMED'])
      .lt('created_at', cutoffTime);

    if (fetchError) {
      console.error('Error fetching abandoned orders:', fetchError);
      return { success: false, error: 'Failed to fetch orders' };
    }

    if (!abandonedOrders || abandonedOrders.length === 0) {
      return { success: true, message: 'No abandoned orders found' };
    }

    // Update all abandoned orders
    const { error: updateError } = await client
      .from('orders')
      .update({
        status: 'ABANDONED',
        updated_at: new Date().toISOString(),
      })
      .in(
        'id',
        abandonedOrders.map((o) => o.id)
      );

    if (updateError) {
      console.error('Error updating abandoned orders:', updateError);
      return { success: false, error: 'Failed to update orders' };
    }

    // Send notifications and recalculate village thresholds
    for (const order of abandonedOrders) {
      try {
        // Notify customer
        await notifyOrderStatusChange(
          order.id,
          'ABANDONED',
          order.customer_id,
          { order_id: order.id.slice(0, 8) }
        );
      } catch (err) {
        console.error(`Error notifying customer for order ${order.id}:`, err);
      }

      // Recalculate village threshold
      try {
        const { data: orders } = await client
          .from('orders')
          .select('quantity_kg')
          .eq('village_id', order.village_id)
          .in('status', ['PENDING', 'CONFIRMED', 'READY', 'COLLECTED'])
          .eq('payment_status', 'PAID');

        const newTotal = (orders?.reduce((sum, o) => sum + o.quantity_kg, 0) || 0);

        await client
          .from('villages')
          .update({ current_total_kg: newTotal })
          .eq('id', order.village_id);
      } catch (err) {
        console.error(
          `Error recalculating village ${order.village_id} threshold:`,
          err
        );
      }
    }

    return {
      success: true,
      message: `${abandonedOrders.length} orders marked as abandoned`,
    };
  } catch (err) {
    console.error('Abandoned order cleanup error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * CRON: Daily at midnight (00:00 UTC)
 * Reset village thresholds to 0 for the new day
 */
export async function dailyThresholdReset() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Reset all villages to 0 kg
    const { error } = await client
      .from('villages')
      .update({
        current_total_kg: 0,
        updated_at: new Date().toISOString(),
      })
      .gte('id', '0'); // Update all rows

    if (error) {
      console.error('Error resetting thresholds:', error);
      return { success: false, error: 'Failed to reset thresholds' };
    }

    return {
      success: true,
      message: 'All village thresholds reset to 0 kg',
    };
  } catch (err) {
    console.error('Daily threshold reset error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * CRON: Daily at 2 AM (02:00 UTC)
 * Send daily earnings reports to agents
 */
export async function dailyAgentEarningsReport() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Get yesterday's date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayStart = new Date(yesterday);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(yesterday);
    dayEnd.setHours(23, 59, 59, 999);

    // Find all pickup agents
    const { data: agents, error: agentError } = await client
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'PICKUP_AGENT');

    if (agentError) {
      console.error('Error fetching agents:', agentError);
      return { success: false, error: 'Failed to fetch agents' };
    }

    if (!agents || agents.length === 0) {
      return { success: true, message: 'No agents found' };
    }

    // Calculate earnings for each agent
    for (const agent of agents) {
      try {
        // Get orders collected by this agent yesterday
        const { data: collections } = await client
          .from('collection_proofs')
          .select('amount')
          .eq('agent_id', agent.id)
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());

        const dailyEarnings = (
          collections?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        );

        // Get this month's total earnings
        const monthStart = new Date(yesterday);
        monthStart.setDate(1);

        const { data: monthCollections } = await client
          .from('collection_proofs')
          .select('amount')
          .eq('agent_id', agent.id)
          .gte('created_at', monthStart.toISOString());

        const monthlyEarnings = (
          monthCollections?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        );

        // Send SMS if earnings > 0
        if (dailyEarnings > 0) {
          const ordersCollected = collections?.length || 0;
          const monthName = yesterday.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });

          await notifyAgentEarnings(
            agent.id,
            ordersCollected,
            dailyEarnings,
            monthlyEarnings,
            monthName
          );
        }
      } catch (err) {
        console.error(`Error processing earnings for agent ${agent.id}:`, err);
      }
    }

    return {
      success: true,
      message: `Daily earnings reports sent to ${agents.length} agents`,
    };
  } catch (err) {
    console.error('Daily earnings report error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * CRON: Daily at 3 AM (03:00 UTC)
 * Clean up expired refunds and mark them as expired
 */
export async function refundExpiryCleanup() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Find refunds that are pending/approved but > 30 days old
    const cutoffTime = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: expiredRefunds, error: fetchError } = await client
      .from('refund_requests')
      .select('id, status')
      .in('status', ['PENDING', 'APPROVED'])
      .lt('requested_at', cutoffTime);

    if (fetchError) {
      console.error('Error fetching expired refunds:', fetchError);
      return { success: false, error: 'Failed to fetch refunds' };
    }

    if (!expiredRefunds || expiredRefunds.length === 0) {
      return { success: true, message: 'No expired refunds found' };
    }

    // Mark them as expired
    const { error: updateError } = await client
      .from('refund_requests')
      .update({
        status: 'EXPIRED',
        updated_at: new Date().toISOString(),
      })
      .in(
        'id',
        expiredRefunds.map((r) => r.id)
      );

    if (updateError) {
      console.error('Error updating expired refunds:', updateError);
      return { success: false, error: 'Failed to update refunds' };
    }

    return {
      success: true,
      message: `${expiredRefunds.length} refunds marked as expired`,
    };
  } catch (err) {
    console.error('Refund expiry cleanup error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * CRON: Every 6 hours
 * Clean up old notifications (older than 90 days)
 */
export async function notificationCleanup() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Find notifications older than 90 days
    const cutoffTime = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await client
      .from('notifications')
      .delete()
      .lt('created_at', cutoffTime);

    if (error) {
      console.error('Error deleting old notifications:', error);
      return { success: false, error: 'Failed to delete notifications' };
    }

    return {
      success: true,
      message: 'Old notifications cleaned up (> 90 days)',
    };
  } catch (err) {
    console.error('Notification cleanup error:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * CRON: Daily at 4 AM (04:00 UTC)
 * Deactivate sellers who haven't confirmed orders in 30 days
 */
export async function sellerInactivityCheck() {
  if (isPlaceholderEnv()) return SKIP_RESULT;
  try {
    const client = await createServerClient();

    // Find sellers with no orders in last 30 days
    const cutoffTime = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: inactiveSellers, error: fetchError } = await client
      .from('profiles')
      .select('id')
      .eq('role', 'SELLER')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching sellers:', fetchError);
      return { success: false, error: 'Failed to fetch sellers' };
    }

    if (!inactiveSellers) {
      return { success: true, message: 'No inactive sellers found' };
    }

    // Check each seller's last order
    let deactivatedCount = 0;

    for (const seller of inactiveSellers) {
      const { data: lastOrder } = await client
        .from('orders')
        .select('created_at')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!lastOrder || new Date(lastOrder.created_at) < new Date(cutoffTime)) {
        // Deactivate seller
        await client
          .from('profiles')
          .update({ is_active: false })
          .eq('id', seller.id);

        deactivatedCount++;
      }
    }

    return {
      success: true,
      message: `${deactivatedCount} inactive sellers deactivated`,
    };
  } catch (err) {
    console.error('Seller inactivity check error:', err);
    return { success: false, error: 'Internal server error' };
  }
}
