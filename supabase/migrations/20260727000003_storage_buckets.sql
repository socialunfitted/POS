-- ==============================================================================
-- OMNIPOS SAAS POS BILLING PLATFORM - STORAGE BUCKETS CONFIGURATION MIGRATION
-- Migration ID: 20260727000003_storage_buckets
-- Target DB Engine: PostgreSQL / Supabase Storage
-- ==============================================================================

-- 1. CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('store-logos', 'store-logos', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml']),
  ('invoice-pdfs', 'invoice-pdfs', false, 10485760, ARRAY['application/pdf']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE ROW LEVEL SECURITY POLICIES

-- Product Images Policies
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload for product images"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND auth.role() = 'authenticated'
);

-- Store Logos Policies
CREATE POLICY "Public read access for store logos"
ON storage.objects FOR SELECT USING (bucket_id = 'store-logos');

CREATE POLICY "Authenticated upload for store logos"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'store-logos' AND auth.role() = 'authenticated'
);

-- Invoice PDFs Policies (Private)
CREATE POLICY "Tenant authenticated read access for invoice PDFs"
ON storage.objects FOR SELECT USING (
    bucket_id = 'invoice-pdfs' AND auth.role() = 'authenticated'
);

CREATE POLICY "System upload access for invoice PDFs"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'invoice-pdfs' AND auth.role() = 'authenticated'
);

-- Avatars Policies
CREATE POLICY "Public read access for avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Owner upload access for avatars"
ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
);
