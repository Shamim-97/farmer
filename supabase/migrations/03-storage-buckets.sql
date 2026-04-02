-- supabase/migrations/03-storage-buckets.sql
-- Storage buckets for NID photos and product images

-- Create NID documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('nid-documents', 'nid-documents', FALSE)
ON CONFLICT DO NOTHING;

-- NID bucket RLS policies
CREATE POLICY "Users can upload NID photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nid-documents' AND
    (auth.uid())::text = owner
  );

CREATE POLICY "Users can view their own NID photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nid-documents' AND
    (auth.uid())::text = owner
  );

CREATE POLICY "Admin can view all NID photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nid-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admin can delete NID photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'nid-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create product images bucket (public for browsing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT DO NOTHING;

-- Product images bucket RLS policies
CREATE POLICY "Everyone can view product images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Sellers can upload product images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'SELLER' AND nid_status = 'APPROVED'
    )
  );

CREATE POLICY "Sellers can manage their own product images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images' AND
    (auth.uid())::text = owner
  );

-- Create refund proof bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('refund-proofs', 'refund-proofs', FALSE)
ON CONFLICT DO NOTHING;

-- Refund proofs bucket RLS policies
CREATE POLICY "Users can upload refund proofs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'refund-proofs' AND
    (auth.uid())::text = owner
  );

CREATE POLICY "Users can view their own refund proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'refund-proofs' AND
    (auth.uid())::text = owner
  );

CREATE POLICY "Admin can view all refund proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'refund-proofs' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
