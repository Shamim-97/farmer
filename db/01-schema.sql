-- ===========================================================
-- FRESHMARKET BD — COMPLETE SQL SCHEMA WITH RLS POLICIES
-- ===========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ===========================================================
-- ENUM TYPES
-- ===========================================================

CREATE TYPE public.user_role AS ENUM ('CUSTOMER', 'SELLER', 'PICKUP_AGENT', 'ADMIN');
CREATE TYPE public.nid_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.product_category AS ENUM ('FISH', 'VEGETABLE', 'MEAT', 'DAIRY', 'OTHER');
CREATE TYPE public.order_status AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'COLLECTED', 'ABANDONED', 'CANCELLED');
CREATE TYPE public.order_source AS ENUM ('WEB', 'FB_LIVE', 'WHATSAPP', 'TELEGRAM', 'MANUAL');
CREATE TYPE public.payment_status AS ENUM ('UNPAID', 'PAID', 'REFUNDED');
CREATE TYPE public.platform AS ENUM ('FACEBOOK', 'WHATSAPP', 'TELEGRAM');
CREATE TYPE public.refund_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.day_of_week AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- ===========================================================
-- VILLAGES TABLE
-- ===========================================================

CREATE TABLE public.villages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_bn VARCHAR(255) NOT NULL,
  min_threshold_kg NUMERIC(10, 2) NOT NULL DEFAULT 100,
  current_total_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
  agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_village_agent FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_villages_name_en ON public.villages(name_en);
CREATE INDEX idx_villages_name_bn ON public.villages(name_bn);
CREATE INDEX idx_villages_agent_id ON public.villages(agent_id);

-- ===========================================================
-- PICKUP_POINTS TABLE
-- ===========================================================

CREATE TABLE public.pickup_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  village_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  gps_lat NUMERIC(10, 8) NOT NULL,
  gps_lng NUMERIC(11, 8) NOT NULL,
  agent_id UUID NOT NULL,
  active_days public.day_of_week[] NOT NULL DEFAULT ARRAY['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_pickup_village FOREIGN KEY (village_id) REFERENCES public.villages(id) ON DELETE CASCADE,
  CONSTRAINT fk_pickup_agent FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE RESTRICT
);

CREATE INDEX idx_pickup_points_village_id ON public.pickup_points(village_id);
CREATE INDEX idx_pickup_points_agent_id ON public.pickup_points(agent_id);
CREATE INDEX idx_pickup_points_is_active ON public.pickup_points(is_active);

-- ===========================================================
-- PROFILES TABLE
-- ===========================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  phone VARCHAR(20) NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'CUSTOMER',
  village_id UUID,
  nid_status public.nid_status DEFAULT 'PENDING',
  nid_front_url VARCHAR(500),
  nid_back_url VARCHAR(500),
  nid_rejection_reason TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_profile_village FOREIGN KEY (village_id) REFERENCES public.villages(id) ON DELETE SET NULL
);

CREATE INDEX idx_profiles_phone ON public.profiles(phone);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_village_id ON public.profiles(village_id);
CREATE INDEX idx_profiles_nid_status ON public.profiles(nid_status);

-- ===========================================================
-- PRODUCTS TABLE
-- ===========================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  name_bn VARCHAR(255) NOT NULL,
  category public.product_category NOT NULL,
  description_en TEXT,
  description_bn TEXT,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  min_order_kg NUMERIC(10, 2) NOT NULL DEFAULT 1,
  min_size_cm NUMERIC(10, 2),
  stock_kg NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  thumbnail_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  is_refundable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_product_seller FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_price_positive CHECK (price_per_kg > 0),
  CONSTRAINT check_stock_non_negative CHECK (stock_kg >= 0),
  CONSTRAINT check_min_order_positive CHECK (min_order_kg > 0)
);

CREATE INDEX idx_products_seller_id ON public.products(seller_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_is_active ON public.products(is_active);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- ===========================================================
-- ORDERS TABLE
-- ===========================================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  pickup_point_id UUID NOT NULL,
  village_id UUID NOT NULL,
  quantity_kg NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL,
  status public.order_status DEFAULT 'PENDING',
  pickup_date DATE NOT NULL,
  order_source public.order_source DEFAULT 'WEB',
  payment_status public.payment_status DEFAULT 'UNPAID',
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  collected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_seller FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_pickup_point FOREIGN KEY (pickup_point_id) REFERENCES public.pickup_points(id) ON DELETE RESTRICT,
  CONSTRAINT fk_order_village FOREIGN KEY (village_id) REFERENCES public.villages(id) ON DELETE RESTRICT,
  CONSTRAINT check_quantity_positive CHECK (quantity_kg > 0),
  CONSTRAINT check_total_amount_non_negative CHECK (total_amount >= 0)
);

CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX idx_orders_product_id ON public.orders(product_id);
CREATE INDEX idx_orders_village_id ON public.orders(village_id);
CREATE INDEX idx_orders_pickup_point_id ON public.orders(pickup_point_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_pickup_date ON public.orders(pickup_date);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX idx_orders_customer_pickup_date ON public.orders(customer_id, pickup_date);

-- ===========================================================
-- LIVE_SESSIONS TABLE
-- ===========================================================

CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL,
  platform public.platform NOT NULL,
  stream_url VARCHAR(500),
  title_en VARCHAR(255),
  title_bn VARCHAR(255),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_live_session_seller FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_live_sessions_seller_id ON public.live_sessions(seller_id);
CREATE INDEX idx_live_sessions_status ON public.live_sessions(status);
CREATE INDEX idx_live_sessions_platform ON public.live_sessions(platform);
CREATE INDEX idx_live_sessions_started_at ON public.live_sessions(started_at DESC);

-- ===========================================================
-- REFUND_REQUESTS TABLE
-- ===========================================================

CREATE TABLE public.refund_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  reason TEXT NOT NULL,
  proof_photo_url VARCHAR(500),
  status public.refund_status DEFAULT 'PENDING',
  admin_note TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_refund_order FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_refund_customer FOREIGN KEY (customer_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT check_refund_within_window CHECK (
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 <= 2
  )
);

CREATE INDEX idx_refund_requests_order_id ON public.refund_requests(order_id);
CREATE INDEX idx_refund_requests_customer_id ON public.refund_requests(customer_id);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status);
CREATE INDEX idx_refund_requests_created_at ON public.refund_requests(created_at DESC);

-- ===========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===========================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.villages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

-- ===========================================================
-- PROFILES RLS POLICIES
-- ===========================================================

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- ADMIN can view all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- SELLER can view profiles of others (for customer info)
CREATE POLICY "profiles_select_seller" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'SELLER')
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ADMIN can update any profile (for NID approval)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===========================================================
-- VILLAGES RLS POLICIES
-- ===========================================================

-- Everyone can view villages
CREATE POLICY "villages_select_all" ON public.villages
  FOR SELECT USING (TRUE);

-- ADMIN can create/update villages
CREATE POLICY "villages_insert_admin" ON public.villages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "villages_update_admin" ON public.villages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===========================================================
-- PICKUP_POINTS RLS POLICIES
-- ===========================================================

-- Everyone can view pickup points
CREATE POLICY "pickup_points_select_all" ON public.pickup_points
  FOR SELECT USING (TRUE);

-- ADMIN can create/update pickup points
CREATE POLICY "pickup_points_insert_admin" ON public.pickup_points
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "pickup_points_update_admin" ON public.pickup_points
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- PICKUP_AGENT can view pickup points assigned to them
CREATE POLICY "pickup_points_select_agent" ON public.pickup_points
  FOR SELECT USING (agent_id = auth.uid());

-- ===========================================================
-- PRODUCTS RLS POLICIES
-- ===========================================================

-- Everyone can view active products
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (is_active = TRUE);

-- ADMIN can view all products (including inactive)
CREATE POLICY "products_select_admin" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- SELLER can view their own products
CREATE POLICY "products_select_seller" ON public.products
  FOR SELECT USING (
    seller_id = auth.uid() OR is_active = TRUE
  );

-- Only SELLER with APPROVED NID can create products
CREATE POLICY "products_insert_seller" ON public.products
  FOR INSERT WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SELLER' AND nid_status = 'APPROVED'
    )
  );

-- Only seller can update their own products
CREATE POLICY "products_update_seller" ON public.products
  FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SELLER' AND nid_status = 'APPROVED'
    )
  );

-- ADMIN can delete any product
CREATE POLICY "products_delete_admin" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===========================================================
-- ORDERS RLS POLICIES
-- ===========================================================

-- Customer can view their own orders
CREATE POLICY "orders_select_customer" ON public.orders
  FOR SELECT USING (customer_id = auth.uid());

-- Seller can view orders for their products
CREATE POLICY "orders_select_seller" ON public.orders
  FOR SELECT USING (seller_id = auth.uid());

-- Pickup agent can view orders for their pickup points
CREATE POLICY "orders_select_agent" ON public.orders
  FOR SELECT USING (
    pickup_point_id IN (
      SELECT id FROM public.pickup_points WHERE agent_id = auth.uid()
    )
  );

-- ADMIN can view all orders
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only customer can create orders (via server action)
CREATE POLICY "orders_insert_customer" ON public.orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'CUSTOMER'
    )
  );

-- PICKUP_AGENT can update order status (mark collected)
CREATE POLICY "orders_update_agent" ON public.orders
  FOR UPDATE USING (
    pickup_point_id IN (
      SELECT id FROM public.pickup_points WHERE agent_id = auth.uid()
    )
  )
  WITH CHECK (
    pickup_point_id IN (
      SELECT id FROM public.pickup_points WHERE agent_id = auth.uid()
    )
  );

-- SELLER can update their orders
CREATE POLICY "orders_update_seller" ON public.orders
  FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ADMIN can update any order
CREATE POLICY "orders_update_admin" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===========================================================
-- LIVE_SESSIONS RLS POLICIES
-- ===========================================================

-- Everyone can view active live sessions
CREATE POLICY "live_sessions_select_all" ON public.live_sessions
  FOR SELECT USING (status = 'ACTIVE');

-- SELLER can view their own live sessions
CREATE POLICY "live_sessions_select_seller" ON public.live_sessions
  FOR SELECT USING (seller_id = auth.uid());

-- ADMIN can view all live sessions
CREATE POLICY "live_sessions_select_admin" ON public.live_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only seller with APPROVED NID can create live session
CREATE POLICY "live_sessions_insert_seller" ON public.live_sessions
  FOR INSERT WITH CHECK (
    seller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SELLER' AND nid_status = 'APPROVED'
    )
  );

-- Seller can update their own live sessions
CREATE POLICY "live_sessions_update_seller" ON public.live_sessions
  FOR UPDATE USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

-- ===========================================================
-- REFUND_REQUESTS RLS POLICIES
-- ===========================================================

-- Customer can view their own refund requests
CREATE POLICY "refund_requests_select_customer" ON public.refund_requests
  FOR SELECT USING (customer_id = auth.uid());

-- ADMIN can view all refund requests
CREATE POLICY "refund_requests_select_admin" ON public.refund_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Only customer can create refund request
CREATE POLICY "refund_requests_insert_customer" ON public.refund_requests
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'CUSTOMER'
    )
  );

-- ADMIN can update refund requests (approve/reject)
CREATE POLICY "refund_requests_update_admin" ON public.refund_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===========================================================
-- HELPER FUNCTIONS
-- ===========================================================

-- Function to recalculate village threshold after order placement
CREATE OR REPLACE FUNCTION public.recalculate_village_threshold()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.villages
  SET current_total_kg = (
    SELECT COALESCE(SUM(quantity_kg), 0)
    FROM public.orders
    WHERE village_id = NEW.village_id
    AND pickup_date = NEW.pickup_date
    AND status IN ('PENDING', 'CONFIRMED', 'READY', 'COLLECTED')
    AND payment_status = 'PAID'
  )
  WHERE id = NEW.village_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate village threshold when order is created/updated
CREATE TRIGGER trigger_village_threshold_on_order
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_village_threshold();

-- Function to auto-reject refund if no proof photo
CREATE OR REPLACE FUNCTION public.auto_reject_refund_no_photo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.proof_photo_url IS NULL THEN
    NEW.status := 'REJECTED'::public.refund_status;
    NEW.admin_note := 'No proof photo provided. Refund automatically rejected.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reject refund without photo
CREATE TRIGGER trigger_auto_reject_refund
BEFORE INSERT ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.auto_reject_refund_no_photo();

-- ===========================================================
-- INDEXES FOR PERFORMANCE
-- ===========================================================

-- Composite indexes for common queries
CREATE INDEX idx_orders_status_pickup_date ON public.orders(status, pickup_date);
CREATE INDEX idx_orders_village_pickup_date ON public.orders(village_id, pickup_date);
CREATE INDEX idx_products_seller_active ON public.products(seller_id, is_active);
CREATE INDEX idx_pickup_points_village_active ON public.pickup_points(village_id, is_active);
CREATE INDEX idx_live_sessions_seller_status ON public.live_sessions(seller_id, status);

-- ===========================================================
-- TIMESTAMP TRIGGERS
-- ===========================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to all tables
CREATE TRIGGER trigger_update_profiles_timestamp
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_villages_timestamp
BEFORE UPDATE ON public.villages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_pickup_points_timestamp
BEFORE UPDATE ON public.pickup_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_products_timestamp
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_orders_timestamp
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_live_sessions_timestamp
BEFORE UPDATE ON public.live_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_update_refund_requests_timestamp
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

