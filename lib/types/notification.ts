/**
 * Notification Types & Templates
 * Handles SMS/WhatsApp notifications for all marketplace events
 */

export enum NotificationType {
  // Order notifications
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_READY = 'ORDER_READY',
  ORDER_COLLECTED = 'ORDER_COLLECTED',
  ORDER_ABANDONED = 'ORDER_ABANDONED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',

  // Refund notifications
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUND_APPROVED = 'REFUND_APPROVED',
  REFUND_REJECTED = 'REFUND_REJECTED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',

  // NID notifications
  NID_SUBMITTED = 'NID_SUBMITTED',
  NID_APPROVED = 'NID_APPROVED',
  NID_REJECTED = 'NID_REJECTED',

  // Agent notifications
  AGENT_DUTY_STARTED = 'AGENT_DUTY_STARTED',
  AGENT_DUTY_ENDED = 'AGENT_DUTY_ENDED',
  AGENT_EARNINGS = 'AGENT_EARNINGS',
}

export enum NotificationChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED',
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  phone_number: string;
  message: string;
  reference_id?: string;
  metadata?: Record<string, any>;
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

export const NOTIFICATION_MESSAGES = {
  ORDER_CREATED: (orderData: any) =>
    `🛒 Order Confirmed!\nOrder ID: ${orderData.order_id}\nAmount: ৳${orderData.amount}\nPickup: ${orderData.pickup_point}\nFreshMarket BD`,

  ORDER_CONFIRMED: (orderData: any) =>
    `✓ Seller Confirmed!\nYour order (${orderData.order_id}) has been confirmed.\nPickup on ${orderData.pickup_date}\nFreshMarket BD`,

  ORDER_READY: (orderData: any) =>
    `📦 Ready for Pickup!\nYour ${orderData.quantity}kg order at ${orderData.pickup_point} is ready now.\nThank you!\nFreshMarket BD`,

  ORDER_COLLECTED: (orderData: any) =>
    `✅ Order Collected!\nThank you for your purchase. Enjoy your fresh products!\nFreshMarket BD`,

  ORDER_ABANDONED: (orderData: any) =>
    `⚠️ Order Not Collected\nYour order (${orderData.order_id}) won't be held after 24h. Contact us if needed.\nFreshMarket BD`,

  ORDER_CANCELLED: (orderData: any) =>
    `❌ Order Cancelled\nYour order has been cancelled. Refund will be processed.\nFreshMarket BD`,

  REFUND_REQUESTED: (refundData: any) =>
    `🔄 Refund Requested\nWe received your refund request for ৳${refundData.amount}.\nReview time: 1-2 business days.\nFreshMarket BD`,

  REFUND_APPROVED: (refundData: any) =>
    `✓ Refund Approved!\n৳${refundData.amount} will be refunded to your account within 2-3 days.\nFreshMarket BD`,

  REFUND_REJECTED: (refundData: any) =>
    `⚠️ Refund Rejected\nReason: ${refundData.reason}\nFor questions, contact support.\nFreshMarket BD`,

  REFUND_PROCESSED: (refundData: any) =>
    `✅ Refund Complete!\n৳${refundData.amount} has been refunded.\nThank you for your understanding.\nFreshMarket BD`,

  NID_SUBMITTED: (userData: any) =>
    `📄 NID Verified\nYour National ID has been received and is under review.\nFreshMarket BD`,

  NID_APPROVED: (userData: any) =>
    `✅ NID Approved!\nYour account is now verified. Start selling on FreshMarket!\nFreshMarket BD`,

  NID_REJECTED: (userData: any) =>
    `⚠️ NID Review Failed\nPlease resubmit with clear photos. Support ready to help.\nFreshMarket BD`,

  AGENT_DUTY_STARTED: (agentData: any) =>
    `▶️ Duty Started\nSession active. Orders ready for collection.\nFreshMarket BD`,

  AGENT_DUTY_ENDED: (agentData: any) =>
    `⏸️ Duty Ended\nOrders collected: ${agentData.orders}\nEarnings: ৳${agentData.earnings}\nFreshMarket BD`,

  AGENT_EARNINGS: (agentData: any) =>
    `💰 Daily Earnings\nToday: ৳${agentData.earnings}\nTotal (${agentData.month}): ৳${agentData.total}\nFreshMarket BD`,
} as const;
