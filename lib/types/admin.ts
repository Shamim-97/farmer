export type AdminDashboardView = 'orders' | 'agents' | 'analytics' | 'map';

export interface AdminOrderView {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  quantity_kg: number;
  total_amount: number;
  status: string;
  payment_status: string;
  pickup_point: string;
  village_name: string;
  seller_name: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminAgentView {
  id: string;
  name: string;
  phone: string;
  pickup_point: string;
  status: 'AVAILABLE' | 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';
  current_session?: {
    started_at: string;
    orders_collected: number;
    earnings: number;
    gps_lat?: number;
    gps_lng?: number;
  };
  today_stats: {
    orders_collected: number;
    earnings: number;
    collections_count: number;
  };
}

export interface AdminAnalytics {
  total_orders_today: number;
  pending_orders: number;
  ready_orders: number;
  collected_orders: number;
  abandoned_orders: number;
  total_revenue_today: number;
  avg_order_value: number;
  delivery_fee_collected: number;
  agents_on_duty: number;
  avg_collection_time_minutes: number;
  villages_reached: number;
  best_performing_agent?: {
    name: string;
    collections: number;
    earnings: number;
  };
  orders_by_status: {
    PENDING: number;
    CONFIRMED: number;
    READY: number;
    COLLECTED: number;
    ABANDONED: number;
    CANCELLED: number;
  };
  orders_by_village: Array<{
    village: string;
    orders: number;
    revenue: number;
  }>;
  hourly_orders: Array<{
    hour: number;
    orders: number;
  }>;
}

export interface AdminOrderDetail extends AdminOrderView {
  seller_phone: string;
  seller_nid_status: string;
  location_details: {
    pickup_point_lat: number;
    pickup_point_lng: number;
    village_lat: number;
    village_lng: number;
  };
  collection_proof?: {
    photo_url: string;
    gps_lat: number;
    gps_lng: number;
    collected_at: string;
  };
}

export interface RealtimeOrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_CONFIRMED' | 'ORDER_READY' | 'ORDER_COLLECTED' | 'ORDER_ABANDONED' | 'ORDER_CANCELLED';
  order_id: string;
  timestamp: string;
  data: AdminOrderView;
}

export interface AgentLocationUpdate {
  agent_id: string;
  pickup_point_id: string;
  gps_lat: number;
  gps_lng: number;
  timestamp: string;
  orders_collected_today: number;
}

export interface HeatmapDataPoint {
  village: string;
  lat: number;
  lng: number;
  orders_count: number;
  intensity: number; // 0-1 scale for color intensity
  revenue: number;
}
