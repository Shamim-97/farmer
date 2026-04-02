/**
 * Refund Request Types
 * Handles customer refund requests and admin refund management
 */

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RefundReason {
  NOT_RECEIVED = 'NOT_RECEIVED',
  DAMAGED_PRODUCT = 'DAMAGED_PRODUCT',
  WRONG_PRODUCT = 'WRONG_PRODUCT',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  CHANGED_MIND = 'CHANGED_MIND',
  OTHER = 'OTHER',
}

export interface RefundRequest {
  id: string;
  order_id: string;
  customer_id: string;
  amount: number;
  reason: RefundReason;
  description: string;
  status: RefundStatus;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  proof_urls: string[];
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  processed_at?: string;
  transaction_id?: string;
  updated_at: string;
}

export interface RefundRequestWithDetails extends RefundRequest {
  order?: {
    id: string;
    created_at: string;
    total_amount: number;
    customer_name: string;
    customer_phone: string;
    product_name: string;
    village_name: string;
  };
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
}

export interface AdminRefundView {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  amount: number;
  reason: RefundReason;
  status: RefundStatus;
  requested_at: string;
  days_since_request: number;
}

export interface AdminRefundDetail extends RefundRequestWithDetails {
  admin_review_time_seconds?: number;
}

export const REFUND_REASON_LABELS = {
  NOT_RECEIVED: 'Product Not Received',
  DAMAGED_PRODUCT: 'Product Damaged',
  WRONG_PRODUCT: 'Wrong Product Sent',
  QUALITY_ISSUE: 'Quality Issue',
  CHANGED_MIND: 'Changed Mind',
  OTHER: 'Other',
} as const;

export const REFUND_STATUS_LABELS = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  PROCESSED: 'Refunded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
} as const;

export const REFUND_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  PROCESSED: 'bg-green-100 text-green-800',
  FAILED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
} as const;
