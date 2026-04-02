export type AgentStatus = 'AVAILABLE' | 'ON_DUTY' | 'ON_BREAK' | 'OFF_DUTY';

export interface PickupAgent {
  id: string;
  user_id: string;
  pickup_point_id: string;
  status: AgentStatus;
  phone: string;
  vehicle_type?: string;
  rating?: number;
  total_collections?: number;
  earnings_today?: number;
  created_at: string;
}

export interface PickupAgentSession {
  id: string;
  agent_id: string;
  pickup_point_id: string;
  status: AgentStatus;
  start_time: string;
  end_time?: string;
  gps_lat?: number;
  gps_lng?: number;
  orders_collected: number;
  earnings: number;
}

export interface AgentOrder {
  id: string;
  customer_id: string;
  seller_id: string;
  product_id: string;
  pickup_point_id: string;
  village_id: string;
  quantity_kg: number;
  unit_price: number;
  delivery_fee: number;
  total_amount: number;
  status: 'READY' | 'COLLECTED' | 'ABANDONED';
  payment_status: 'UNPAID' | 'PAID' | 'REFUNDED';
  payment_method?: string;
  pickup_date: string;
  created_at: string;
  collected_at?: string;
  collection_proof?: string; // photo URL
  customer: {
    full_name: string;
    phone: string;
  };
  product: {
    name_en: string;
  };
}

export interface CollectionProof {
  order_id: string;
  agent_id: string;
  photo_url: string;
  gps_lat: number;
  gps_lng: number;
  timestamp: string;
  signature_data?: string; // base64 signature if needed
}

export interface AgentEarnings {
  total_today: number;
  collections_today: number;
  avg_per_order: number;
  total_week: number;
  total_month: number;
  last_collection?: string;
}

export interface OrderCollection {
  order_id: string;
  agent_id: string;
  collected_at: string;
  gps_lat: number;
  gps_lng: number;
  photo_proof: File;
}
