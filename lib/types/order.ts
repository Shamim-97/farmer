export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'READY' | 'COLLECTED' | 'ABANDONED' | 'CANCELLED';
export type OrderSource = 'WEB' | 'FB_LIVE' | 'WHATSAPP' | 'TELEGRAM' | 'MANUAL';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface Order {
  id: string;
  customer_id: string;
  product_id: string;
  seller_id: string;
  pickup_point_id: string;
  village_id: string;
  quantity_kg: number;
  unit_price: number;
  delivery_fee: number;
  total_amount: number;
  status: OrderStatus;
  pickup_date: string;
  order_source: OrderSource;
  payment_status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  collected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderWithDetails extends Order {
  product?: {
    name_en: string;
    name_bn: string;
    category: string;
  };
  seller?: {
    full_name: string;
    phone?: string;
  };
  pickup_point?: {
    name: string;
  };
}

export interface VillageThresholdInfo {
  village_name: string;
  current_kg: number;
  threshold_kg: number;
  percentage: number;
  kg_remaining: number;
  delivery_fee: number;
  is_free: boolean;
}

export interface CartItem {
  product_id: string;
  product_name_en: string;
  product_name_bn: string;
  seller_id: string;
  quantity_kg: number;
  unit_price: number;
  unit: string;
}

export interface CartState {
  items: CartItem[];
  village_id?: string;
  pickup_point_id?: string;
  pickup_date?: string;
}

export interface PlaceOrderRequest {
  customer_id: string;
  product_id: string;
  seller_id: string;
  pickup_point_id: string;
  village_id: string;
  quantity_kg: number;
  unit_price: number;
  pickup_date: string;
  order_source?: OrderSource;
  payment_method?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  error?: string;
  data?: {
    order_id: string;
    total_amount: number;
    delivery_fee: number;
    is_free_pickup: boolean;
  };
}
