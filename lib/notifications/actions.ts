'use server';

import { createServerClient } from '@/lib/supabase/server';
import { isPlaceholderEnv } from '@/lib/env';
import {
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  NOTIFICATION_MESSAGES,
} from '@/lib/types/notification';

const SKIP = { success: false as const, error: 'Supabase not configured' };
const SKIP_DATA = { success: true as const, data: [] as any[] };

/**
 * Send SMS/WhatsApp notification to user
 * Integrates with Twilio, SSLCommerz, or other SMS provider
 */
export async function sendNotification(
  userId: string,
  phone: string,
  notificationType: NotificationType,
  channel: NotificationChannel = NotificationChannel.SMS,
  data: any = {},
  referenceId?: string
) {
  if (isPlaceholderEnv()) return SKIP;
  try {
    const client = await createServerClient();

    // Generate message
    const messageGenerator = NOTIFICATION_MESSAGES[
      notificationType as keyof typeof NOTIFICATION_MESSAGES
    ];
    const message = typeof messageGenerator === 'function'
      ? messageGenerator(data)
      : String(messageGenerator);

    // Save to database
    const { data: notification, error: saveError } = await client
      .from('notifications')
      .insert({
        user_id: userId,
        type: notificationType,
        channel,
        status: NotificationStatus.PENDING,
        phone_number: phone,
        message,
        reference_id: referenceId,
        metadata: data,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving notification:', saveError);
      return { success: false, error: 'Failed to save notification' };
    }

    // Send via API endpoint
    const sendResult = await sendViaSMSProvider(
      phone,
      message,
      notification.id,
      channel
    );

    return { success: true, data: notification, send: sendResult };
  } catch (err) {
    console.error('Error sending notification:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Send notification via SMS provider
 * This is a placeholder - integrate with real SMS provider
 */
async function sendViaSMSProvider(
  phone: string,
  message: string,
  notificationId: string,
  channel: NotificationChannel
) {
  try {
    // Call actual SMS provider API
    // Example with Twilio:
    // const response = await fetch('https://api.twilio.com/...', {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${process.env.TWILIO_AUTH_TOKEN}` },
    //   body: JSON.stringify({ to: phone, message }),
    // });

    // For now, log and mark as sent
    console.log(
      `[${channel}] Message to ${phone}: ${message.substring(0, 50)}...`
    );

    // Update notification status to sent
    const client = await createServerClient();
    await client
      .from('notifications')
      .update({
        status: NotificationStatus.SENT,
        sent_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    return { success: true, sentAt: new Date().toISOString() };
  } catch (err) {
    console.error('Error sending via SMS provider:', err);

    // Update as failed
    const client = await createServerClient();
    await client
      .from('notifications')
      .update({
        status: NotificationStatus.FAILED,
        failed_at: new Date().toISOString(),
        error_message: String(err),
      })
      .eq('id', notificationId);

    return { success: false, error: String(err) };
  }
}

/**
 * Send notification on order status change
 */
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: string,
  customerId: string,
  orderData: any
) {
  if (isPlaceholderEnv()) return;
  const client = await createServerClient();

  // Get customer phone
  const { data: customer } = await client
    .from('profiles')
    .select('phone')
    .eq('id', customerId)
    .single();

  if (!customer?.phone) return;

  let notificationType: NotificationType | null = null;

  switch (newStatus) {
    case 'CONFIRMED':
      notificationType = NotificationType.ORDER_CONFIRMED;
      break;
    case 'READY':
      notificationType = NotificationType.ORDER_READY;
      break;
    case 'COLLECTED':
      notificationType = NotificationType.ORDER_COLLECTED;
      break;
    case 'ABANDONED':
      notificationType = NotificationType.ORDER_ABANDONED;
      break;
    case 'CANCELLED':
      notificationType = NotificationType.ORDER_CANCELLED;
      break;
  }

  if (notificationType) {
    await sendNotification(
      customerId,
      customer.phone,
      notificationType,
      NotificationChannel.SMS,
      {
        order_id: orderId.slice(0, 8),
        amount: orderData.total_amount,
        pickup_point: orderData.pickup_point_name || 'Your pickup point',
        pickup_date: orderData.pickup_date,
        quantity: orderData.quantity_kg,
      },
      orderId
    );
  }
}

/**
 * Send notification on refund status change
 */
export async function notifyRefundStatusChange(
  refundId: string,
  newStatus: string,
  customerId: string,
  refundAmount: number,
  reason?: string
) {
  if (isPlaceholderEnv()) return;
  const client = await createServerClient();

  const { data: customer } = await client
    .from('profiles')
    .select('phone')
    .eq('id', customerId)
    .single();

  if (!customer?.phone) return;

  let notificationType: NotificationType | null = null;

  switch (newStatus) {
    case 'APPROVED':
      notificationType = NotificationType.REFUND_APPROVED;
      break;
    case 'REJECTED':
      notificationType = NotificationType.REFUND_REJECTED;
      break;
    case 'PROCESSED':
      notificationType = NotificationType.REFUND_PROCESSED;
      break;
  }

  if (notificationType) {
    await sendNotification(
      customerId,
      customer.phone,
      notificationType,
      NotificationChannel.SMS,
      {
        amount: refundAmount,
        reason: reason || 'Per your request',
      },
      refundId
    );
  }
}

/**
 * Send notification on NID status change
 */
export async function notifyNIDStatusChange(
  userId: string,
  newStatus: string
) {
  if (isPlaceholderEnv()) return;
  const client = await createServerClient();

  const { data: user } = await client
    .from('profiles')
    .select('phone')
    .eq('id', userId)
    .single();

  if (!user?.phone) return;

  let notificationType: NotificationType | null = null;

  switch (newStatus) {
    case 'APPROVED':
      notificationType = NotificationType.NID_APPROVED;
      break;
    case 'REJECTED':
      notificationType = NotificationType.NID_REJECTED;
      break;
  }

  if (notificationType) {
    await sendNotification(
      userId,
      user.phone,
      notificationType,
      NotificationChannel.SMS,
      { user_id: userId },
      userId
    );
  }
}

/**
 * Send notification for agent earnings
 */
export async function notifyAgentEarnings(
  agentId: string,
  ordersCollected: number,
  dailyEarnings: number,
  monthlyEarnings: number,
  month: string
) {
  if (isPlaceholderEnv()) return;
  const client = await createServerClient();

  const { data: agent } = await client
    .from('profiles')
    .select('phone')
    .eq('id', agentId)
    .single();

  if (!agent?.phone) return;

  await sendNotification(
    agentId,
    agent.phone,
    NotificationType.AGENT_EARNINGS,
    NotificationChannel.SMS,
    {
      orders: ordersCollected,
      earnings: dailyEarnings,
      total: monthlyEarnings,
      month,
    },
    agentId
  );
}

/**
 * Get notification history for user
 */
export async function getNotificationHistory(
  userId: string,
  limit = 50
) {
  if (isPlaceholderEnv()) return SKIP_DATA;
  try {
    const client = await createServerClient();

    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: 'Failed to fetch notifications' };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error getting notification history:', err);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Mark notification as delivered
 */
export async function markNotificationDelivered(notificationId: string) {
  if (isPlaceholderEnv()) return SKIP;
  try {
    const client = await createServerClient();

    const { error } = await client
      .from('notifications')
      .update({
        status: NotificationStatus.DELIVERED,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: 'Failed to update notification' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error marking notification as delivered:', err);
    return { success: false, error: 'Internal server error' };
  }
}
