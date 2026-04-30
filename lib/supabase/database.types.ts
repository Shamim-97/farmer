// Hand-derived from db/01-schema.sql.
// TODO: replace with `supabase gen types typescript --project-id <id>` once
// the project ID is wired into CI; until then, keep this in sync manually.
//
// NOTE: Use `type` (not `interface`) for *Row definitions. Postgrest-js's
// GenericTable constraint requires `Row extends Record<string, unknown>`,
// and only `type` aliases satisfy that. Interfaces don't.

export type UserRole = 'CUSTOMER' | 'SELLER' | 'PICKUP_AGENT' | 'ADMIN';
export type NidStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProductCategory = 'FISH' | 'VEGETABLE' | 'MEAT' | 'DAIRY' | 'OTHER';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'READY'
  | 'COLLECTED'
  | 'ABANDONED'
  | 'CANCELLED';
export type OrderSource = 'WEB' | 'FB_LIVE' | 'WHATSAPP' | 'TELEGRAM' | 'MANUAL';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type Platform = 'FACEBOOK' | 'WHATSAPP' | 'TELEGRAM';
export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type AgentSessionStatus = 'ON_DUTY' | 'OFF_DUTY';
export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type VillageRow = {
  id: string;
  name_en: string;
  name_bn: string;
  min_threshold_kg: number;
  current_total_kg: number;
  delivery_fee: number;
  agent_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PickupPointRow = {
  id: string;
  village_id: string;
  name: string;
  gps_lat: number;
  gps_lng: number;
  agent_id: string;
  active_days: DayOfWeek[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string;
  role: UserRole;
  village_id: string | null;
  nid_status: NidStatus;
  nid_front_url: string | null;
  nid_back_url: string | null;
  nid_rejection_reason: string | null;
  is_active: boolean;
  notification_preferences: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
};

export type CollectionProofRow = {
  id: string;
  order_id: string;
  agent_id: string;
  gps_lat: number;
  gps_lng: number;
  photo_url: string;
  timestamp: string;
  created_at: string;
};

export type PickupAgentSessionRow = {
  id: string;
  agent_id: string;
  pickup_point_id: string | null;
  status: AgentSessionStatus;
  start_time: string;
  end_time: string | null;
  started_at: string;
  orders_collected: number;
  earnings: number;
  gps_lat: number | null;
  gps_lng: number | null;
  created_at: string;
  updated_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  channel: string;
  status: NotificationStatus;
  phone_number: string | null;
  message: string;
  reference_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;
  seller_id: string;
  name_en: string;
  name_bn: string;
  category: ProductCategory;
  description_en: string | null;
  description_bn: string | null;
  price_per_kg: number;
  min_order_kg: number;
  min_size_cm: number | null;
  stock_kg: number;
  unit: string;
  thumbnail_url: string | null;
  is_active: boolean;
  is_refundable: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
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
  payment_method: string | null;
  transaction_id: string | null;
  collected_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LiveSessionRow = {
  id: string;
  seller_id: string;
  platform: Platform;
  stream_url: string | null;
  title_en: string | null;
  title_bn: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RefundRequestRow = {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  proof_photo_url: string | null;
  status: RefundStatus;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type Insert<T> = Omit<T, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

type Update<T> = Partial<T>;

type Table<R> = {
  Row: R;
  Insert: Insert<R>;
  Update: Update<R>;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      villages: Table<VillageRow>;
      pickup_points: Table<PickupPointRow>;
      profiles: Table<ProfileRow>;
      products: Table<ProductRow>;
      orders: Table<OrderRow>;
      live_sessions: Table<LiveSessionRow>;
      refund_requests: Table<RefundRequestRow>;
      collection_proofs: Table<CollectionProofRow>;
      pickup_agent_sessions: Table<PickupAgentSessionRow>;
      notifications: Table<NotificationRow>;
    };
    Views: { [k: string]: never };
    Functions: { [k: string]: never };
    Enums: {
      user_role: UserRole;
      nid_status: NidStatus;
      product_category: ProductCategory;
      order_status: OrderStatus;
      order_source: OrderSource;
      payment_status: PaymentStatus;
      platform: Platform;
      refund_status: RefundStatus;
      day_of_week: DayOfWeek;
    };
  };
};
