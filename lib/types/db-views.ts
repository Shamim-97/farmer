// Shapes returned by Supabase nested-embed selects.
// Postgrest can't infer these from our hand-typed Database (no FK metadata),
// so call sites cast their query results to one of these and access fields
// through a real type instead of `any`.

import type {
  OrderRow,
  ProfileRow,
  ProductRow,
  RefundRequestRow,
  PickupPointRow,
  PickupAgentSessionRow,
  VillageRow,
} from '@/lib/supabase/database.types';

// orders + customer/seller/product/village/pickup_point joins (admin order list)
export type OrderWithJoins = Pick<
  OrderRow,
  | 'id'
  | 'customer_id'
  | 'seller_id'
  | 'product_id'
  | 'pickup_point_id'
  | 'village_id'
  | 'quantity_kg'
  | 'total_amount'
  | 'delivery_fee'
  | 'status'
  | 'payment_status'
  | 'pickup_date'
  | 'created_at'
  | 'updated_at'
> & {
  customer: Pick<ProfileRow, 'full_name' | 'phone'> | null;
  seller: Pick<ProfileRow, 'full_name' | 'phone'> | null;
  product: Pick<ProductRow, 'name_en'> | null;
  village: Pick<VillageRow, 'name_en'> | null;
  pickup_point:
    | (Pick<PickupPointRow, 'name' | 'gps_lat' | 'gps_lng'>)
    | null;
};

// orders + pickup_points join used by lib/orders/actions notification helpers
export type OrderWithPickupPoint = OrderRow & {
  pickup_points: Pick<VillageRow, 'name_en'> | null;
};

// agent profile + pickup_points (admin agent list)
export type AgentWithPickupPoint = Pick<
  ProfileRow,
  'id' | 'full_name' | 'phone'
> & {
  pickup_points: Array<Pick<PickupPointRow, 'name' | 'id'>>;
};

export type AgentSession = PickupAgentSessionRow;

// refund + nested order with nested customer/product/village (refund history)
export type RefundWithOrder = RefundRequestRow & {
  order:
    | (Pick<OrderRow, 'id' | 'created_at' | 'total_amount'> & {
        customer: Pick<ProfileRow, 'full_name' | 'phone'> | null;
        product: Pick<ProductRow, 'name_en'> | null;
        village: Pick<VillageRow, 'name_en'> | null;
      })
    | null;
};

// refund + customer profile via fk constraint name (admin approve/reject)
export type RefundWithProfile = Pick<
  RefundRequestRow,
  'id' | 'customer_id' | 'order_id'
> & {
  amount: number;
  profiles: Pick<ProfileRow, 'phone'> | null;
};
