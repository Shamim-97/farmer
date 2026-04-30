'use server';

import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/actions';
import {
  RefundRequest,
  RefundRequestWithDetails,
  AdminRefundView,
  AdminRefundDetail,
  RefundStatus,
  RefundReason,
} from '@/lib/types/refund';
import type { RefundWithOrder, RefundWithProfile } from '@/lib/types/db-views';
import {
  ok,
  err,
  okPaginated,
  type Result,
  type PaginatedResult,
} from '@/lib/types/result';
import {
  notifyRefundStatusChange,
} from '@/lib/notifications/actions';

/**
 * Request a refund for a collected order
 */
export async function requestRefund(
  orderId: string,
  reason: RefundReason,
  description: string,
  proofUrls: string[] = []
) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Get order to verify it exists and is collected
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, customer_id, status, total_amount, payment_status')
      .eq('id', orderId)
      .eq('customer_id', user.id)
      .single();

    if (orderError || !order) {
      return err('Order not found');
    }

    // Only allow refunds for collected orders within 7 days
    const { data: createdOrder } = await client
      .from('orders')
      .select('created_at')
      .eq('id', orderId)
      .single();

    if (createdOrder) {
      const daysSinceOrder = Math.floor(
        (Date.now() - new Date(createdOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceOrder > 7) {
        return err('Refund request period expired (7 days)');
      }
    }

    if (order.status !== 'COLLECTED') {
      return err('Only collected orders can be refunded');
    }

    // Check if refund already exists for this order
    const { data: existingRefund } = await client
      .from('refund_requests')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();

    if (existingRefund) {
      return err('Refund already requested for this order');
    }

    // Create refund request
    const { data: refund, error: refundError } = await client
      .from('refund_requests')
      .insert({
        order_id: orderId,
        customer_id: user.id,
        amount: order.total_amount,
        reason,
        description,
        status: RefundStatus.PENDING,
        payment_status: 'PENDING',
        proof_urls: proofUrls,
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (refundError) {
      console.error('Error creating refund request:', refundError);
      return err('Failed to create refund request');
    }

    return ok(refund as RefundRequest);
  } catch (e) {
    console.error('Error requesting refund:', e);
    return err('Internal server error');
  }
}

/**
 * Get customer's refund requests
 */
export async function getCustomerRefunds() {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    const { data: refunds, error } = await client
      .from('refund_requests')
      .select(
        `
        id,
        order_id,
        amount,
        reason,
        status,
        payment_status,
        requested_at,
        reviewed_at,
        rejection_reason,
        processed_at,
        updated_at,
        order:order_id (
          id,
          created_at,
          total_amount,
          customer:customer_id (full_name, phone),
          product:product_id (name_en),
          village:village_id (name_en)
        )
      `
      )
      .eq('customer_id', user.id)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching refunds:', error);
      return err('Failed to fetch refund requests');
    }

    const typedRefunds = (refunds ?? []) as unknown as RefundWithOrder[];
    const formatted = typedRefunds.map((r) => ({
      ...r,
      customer_name: r.order?.customer?.full_name ?? 'Unknown',
      customer_phone: r.order?.customer?.phone ?? 'N/A',
    })) as unknown as RefundRequestWithDetails[];

    return ok(formatted);
  } catch (e) {
    console.error('Error getting customer refunds:', e);
    return err('Internal server error');
  }
}

/**
 * Get refund request details
 */
export async function getRefundDetail(refundId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    const { data: refund, error } = await client
      .from('refund_requests')
      .select(
        `
        *,
        order:order_id (
          id,
          created_at,
          total_amount,
          customer:customer_id (full_name, phone, email),
          product:product_id (name_en),
          village:village_id (name_en)
        )
      `
      )
      .eq('id', refundId)
      .eq('customer_id', user.id)
      .single();

    if (error || !refund) {
      return err('Refund request not found');
    }

    const formatted = {
      ...refund,
      customer_name: refund.order?.customer?.full_name || 'Unknown',
      customer_phone: refund.order?.customer?.phone || 'N/A',
      customer_email: refund.order?.customer?.email,
    } as AdminRefundDetail;

    return ok(formatted);
  } catch (e) {
    console.error('Error getting refund detail:', e);
    return err('Internal server error');
  }
}

/**
 * ADMIN: Get all pending refund requests
 */
export async function getAdminRefunds(
  status?: RefundStatus,
  limit = 100,
  offset = 0
) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return err('Admin access required');
    }

    let query = client
      .from('refund_requests')
      .select(
        `
        id,
        order_id,
        amount,
        reason,
        status,
        payment_status,
        requested_at,
        updated_at,
        order:order_id (
          id,
          created_at,
          total_amount,
          customer:customer_id (full_name, phone),
          product:product_id (name_en),
          village:village_id (name_en)
        )
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }

    const { data: refunds, error, count } = await query
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching admin refunds:', error);
      return err('Failed to fetch refund requests');
    }

    type RefundForAdmin = RefundWithOrder & { requested_at: string; amount: number };
    const typedRefunds = (refunds ?? []) as unknown as RefundForAdmin[];
    const formatted: AdminRefundView[] = typedRefunds.map((r) => {
      const daysAgo = Math.floor(
        (Date.now() - new Date(r.requested_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: r.id,
        order_id: r.order_id,
        customer_name: r.order?.customer?.full_name ?? 'Unknown',
        customer_phone: r.order?.customer?.phone ?? 'N/A',
        product_name: r.order?.product?.name_en ?? 'Product',
        amount: r.amount,
        reason: r.reason as RefundReason,
        status: r.status as RefundStatus,
        requested_at: r.requested_at,
        days_since_request: daysAgo,
      };
    });

    return okPaginated(formatted, count ?? 0);
  } catch (e) {
    console.error('Error getting admin refunds:', e);
    return err('Internal server error');
  }
}

/**
 * ADMIN: Approve refund request
 */
export async function approveRefund(refundId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return err('Admin access required');
    }

    // Get refund with customer info before updating
    const { data: refundDataRaw } = await client
      .from('refund_requests')
      .select(
        `
        id,
        customer_id,
        amount,
        order_id,
        profiles!refund_requests_customer_id_fkey (phone)
      `
      )
      .eq('id', refundId)
      .single();
    const refundData = refundDataRaw as unknown as RefundWithProfile | null;

    // Update refund status
    const { data: refund, error } = await client
      .from('refund_requests')
      .update({
        status: RefundStatus.APPROVED,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      console.error('Error approving refund:', error);
      return err('Failed to approve refund');
    }

    // Send notification (non-blocking) if customer phone available
    if (refundData?.customer_id && refundData.profiles?.phone) {
      try {
        await notifyRefundStatusChange(
          refundId,
          'APPROVED',
          refundData.customer_id,
          refundData.amount,
          `Your refund has been approved`
        );
      } catch (e) {
        console.error('Error sending notification:', e);
        // Don't fail the approval if notification fails
      }
    }

    return ok(refund as RefundRequest);
  } catch (e) {
    console.error('Error approving refund:', e);
    return err('Internal server error');
  }
}

/**
 * ADMIN: Reject refund request
 */
export async function rejectRefund(refundId: string, rejectionReason: string) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return err('Admin access required');
    }

    // Get refund with customer info before updating
    const { data: refundDataRaw } = await client
      .from('refund_requests')
      .select(
        `
        id,
        customer_id,
        amount,
        profiles!refund_requests_customer_id_fkey (phone)
      `
      )
      .eq('id', refundId)
      .single();
    const refundData = refundDataRaw as unknown as RefundWithProfile | null;

    // Update refund status
    const { data: refund, error } = await client
      .from('refund_requests')
      .update({
        status: RefundStatus.REJECTED,
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      console.error('Error rejecting refund:', error);
      return err('Failed to reject refund');
    }

    // Send notification (non-blocking) if customer phone available
    if (refundData?.customer_id && refundData.profiles?.phone) {
      try {
        await notifyRefundStatusChange(
          refundId,
          'REJECTED',
          refundData.customer_id,
          refundData.amount,
          rejectionReason
        );
      } catch (e) {
        console.error('Error sending notification:', e);
        // Don't fail the rejection if notification fails
      }
    }

    return ok(refund as RefundRequest);
  } catch (e) {
    console.error('Error rejecting refund:', e);
    return err('Internal server error');
  }
}

/**
 * ADMIN: Process approved refund (mark as completed)
 * In production, this would integrate with payment gateway
 */
export async function processRefund(refundId: string, transactionId?: string) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return err('Admin access required');
    }

    // Get refund
    const { data: refund, error: fetchError } = await client
      .from('refund_requests')
      .select('*')
      .eq('id', refundId)
      .single();

    if (fetchError || !refund) {
      return err('Refund request not found');
    }

    if (refund.status !== RefundStatus.APPROVED) {
      return err('Refund must be approved before processing');
    }

    // TODO: Integration with payment gateway (Stripe, SSLCommerz, etc.)
    // For now, we'll just mark as processed

    // Update refund status
    const { data: updated, error } = await client
      .from('refund_requests')
      .update({
        status: RefundStatus.PROCESSED,
        payment_status: 'COMPLETED',
        transaction_id: transactionId || `REFUND_${Date.now()}`,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      console.error('Error processing refund:', error);
      return err('Failed to process refund');
    }

    return ok(updated as RefundRequest);
  } catch (e) {
    console.error('Error processing refund:', e);
    return err('Internal server error');
  }
}

/**
 * ADMIN: Cancel refund request
 */
export async function cancelRefund(refundId: string) {
  const user = await getCurrentUser();

  if (!user) {
    return err('Not authenticated');
  }

  try {
    const client = await createServerClient();

    // Verify admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return err('Admin access required');
    }

    // Update refund status
    const { data: refund, error } = await client
      .from('refund_requests')
      .update({
        status: RefundStatus.CANCELLED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', refundId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling refund:', error);
      return err('Failed to cancel refund');
    }

    return ok(refund as RefundRequest);
  } catch (e) {
    console.error('Error cancelling refund:', e);
    return err('Internal server error');
  }
}
