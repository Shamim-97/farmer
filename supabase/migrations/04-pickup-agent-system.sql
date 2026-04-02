-- ===================================================================
-- STEP 6: PICKUP AGENT SYSTEM - RLS POLICIES AND STORAGE
-- ===================================================================

-- 1. Create collection_proofs table
CREATE TABLE IF NOT EXISTS collection_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  gps_lat DECIMAL(10, 8) NOT NULL,
  gps_lng DECIMAL(11, 8) NOT NULL,
  photo_url TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
  signature_data TEXT,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- 2. Create pickup_agent_sessions table
CREATE TABLE IF NOT EXISTS pickup_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL,
  pickup_point_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ON_DUTY',
  start_time TIMESTAMP NOT NULL DEFAULT now(),
  end_time TIMESTAMP,
  gps_lat DECIMAL(10, 8),
  gps_lng DECIMAL(11, 8),
  orders_collected INTEGER DEFAULT 0,
  earnings DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  FOREIGN KEY (agent_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (pickup_point_id) REFERENCES pickup_points(id) ON DELETE CASCADE
);

-- 3. Index for faster queries
CREATE INDEX idx_collection_proofs_order_id ON collection_proofs(order_id);
CREATE INDEX idx_collection_proofs_agent_id ON collection_proofs(agent_id);
CREATE INDEX idx_collection_proofs_timestamp ON collection_proofs("timestamp");
CREATE INDEX idx_pickup_agent_sessions_agent_id ON pickup_agent_sessions(agent_id);
CREATE INDEX idx_pickup_agent_sessions_start_time ON pickup_agent_sessions(start_time);

-- ===================================================================
-- RLS POLICIES FOR PICKUP AGENTS
-- ===================================================================

-- Enable RLS
ALTER TABLE collection_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_agent_sessions ENABLE ROW LEVEL SECURITY;

-- Collection Proofs: Only agent who collected can view/insert their proofs
CREATE POLICY "collection_proofs_agent_insert" ON collection_proofs
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "collection_proofs_agent_select" ON collection_proofs
  FOR SELECT USING (agent_id = auth.uid());

-- Admin can view all collection proofs
CREATE POLICY "collection_proofs_admin_select" ON collection_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Pickup Agent Sessions: Only agent who started can view/update their sessions
CREATE POLICY "pickup_agent_sessions_agent_insert" ON pickup_agent_sessions
  FOR INSERT WITH CHECK (agent_id = auth.uid());

CREATE POLICY "pickup_agent_sessions_agent_select" ON pickup_agent_sessions
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "pickup_agent_sessions_agent_update" ON pickup_agent_sessions
  FOR UPDATE USING (agent_id = auth.uid());

-- Admin can view all agent sessions
CREATE POLICY "pickup_agent_sessions_admin_select" ON pickup_agent_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===================================================================
-- UPDATE ORDERS TABLE FOR COLLECTED STATUS
-- ===================================================================

-- Pickup agents can view READY orders at their assigned pickup point
CREATE POLICY "orders_agent_ready_select" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pickup_points
      WHERE pickup_points.id = orders.pickup_point_id
        AND pickup_points.agent_id = auth.uid()
        AND orders.status = 'READY'
    )
  );

-- Pickup agents can update READY orders to COLLECTED
CREATE POLICY "orders_agent_collect_update" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM pickup_points
      WHERE pickup_points.id = orders.pickup_point_id
        AND pickup_points.agent_id = auth.uid()
        AND orders.status = 'READY'
    )
  );

-- ===================================================================
-- UPDATE STORAGE BUCKET FOR COLLECTION PROOFS
-- ===================================================================

-- Note: Create/update storage bucket in RLS policies file
-- Create storage bucket: collection_proofs
-- Set media_type: image/jpeg, image/png, image/webp
-- Max file size: 5MB per photo

-- RLS for collection_proofs bucket
CREATE POLICY "agent_upload_collection_proof" ON storage.objects AS auth
  FOR INSERT WITH CHECK (
    bucket_id = 'collection_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "agent_view_collection_proof" ON storage.objects AS auth
  FOR SELECT USING (
    bucket_id = 'collection_proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "admin_view_all_proofs" ON storage.objects AS auth
  FOR SELECT USING (
    bucket_id = 'collection_proofs'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ===================================================================
-- HELPER VIEW FOR AGENT STATISTICS
-- ===================================================================

CREATE VIEW agent_daily_stats AS
SELECT
  agent_id,
  DATE(collected_at) as collection_date,
  COUNT(*) as orders_collected,
  SUM(delivery_fee * 0.3) as commission_earned
FROM orders
WHERE status = 'COLLECTED'
GROUP BY agent_id, DATE(collected_at);

-- ===================================================================
-- GRANT PERMISSIONS
-- ===================================================================

GRANT SELECT ON agent_daily_stats TO authenticated;
