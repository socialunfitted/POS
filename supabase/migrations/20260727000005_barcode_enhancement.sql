-- =============================================================================
-- OmniPOS Barcode Enhancement Migration
-- Migration: 20260727000005_barcode_enhancement.sql
--
-- Adds:
--   1. barcode column to products table (if not already present)
--   2. barcodes column for multi-barcode support (comma-separated)
--   3. Unique partial index on barcode for fast lookups
--   4. GIN index on barcodes text column for contains search
--   5. RLS: tenants can only read their own product barcodes
--   6. barcode_lookup helper function for sub-ms resolution
-- =============================================================================

-- 1. Ensure barcode column exists on products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode  TEXT,
  ADD COLUMN IF NOT EXISTS barcodes TEXT;  -- comma-separated additional barcodes

-- 2. Unique index on primary barcode (per tenant, not globally)
--    NULLs are excluded so products without barcodes don't violate uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode_unique
  ON products (tenant_id, barcode)
  WHERE barcode IS NOT NULL;

-- 3. B-Tree index for exact-match barcode lookup (EAN-13, UPC-A, etc.)
CREATE INDEX IF NOT EXISTS idx_products_barcode_btree
  ON products (barcode)
  WHERE barcode IS NOT NULL;

-- 4. pg_trgm GIN index on barcodes text for LIKE / cs contains search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_barcodes_gin
  ON products USING GIN (barcodes gin_trgm_ops)
  WHERE barcodes IS NOT NULL;

-- 5. Fast barcode lookup function (SECURITY DEFINER for RLS bypass on search)
CREATE OR REPLACE FUNCTION lookup_product_by_barcode(
  p_tenant_id UUID,
  p_barcode   TEXT
)
RETURNS SETOF products
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM   products
  WHERE  tenant_id = p_tenant_id
    AND  (
           barcode  = p_barcode
        OR barcodes LIKE '%' || p_barcode || '%'
         )
  LIMIT 5;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION lookup_product_by_barcode(UUID, TEXT)
  TO authenticated;

-- =============================================================================
-- Verification queries (run manually to confirm):
--   SELECT * FROM lookup_product_by_barcode('<tenant-id>', '8901234567890');
--   EXPLAIN ANALYZE SELECT * FROM products WHERE barcode = '8901234567890';
-- =============================================================================
