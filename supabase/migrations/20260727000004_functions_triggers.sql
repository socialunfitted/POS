-- ==============================================================================
-- OMNIPOS SAAS POS BILLING PLATFORM - FUNCTIONS & TRIGGERS MIGRATION
-- Migration ID: 20260727000004_functions_triggers
-- Target DB Engine: PostgreSQL / Supabase
-- ==============================================================================

-- 1. TRIGGER FUNCTION: AUTO CREATE PROFILE ON USER SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TRIGGER FUNCTION: AUTO DECREMENT STOCK & LOG INVENTORY MOVEMENT ON SALE
CREATE OR REPLACE FUNCTION public.process_invoice_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_old_stock INT;
    v_new_stock INT;
BEGIN
    -- Fetch tenant_id from invoice header
    SELECT tenant_id INTO v_tenant_id FROM public.invoices WHERE id = NEW.invoice_id;

    -- Fetch current product stock
    SELECT stock_quantity INTO v_old_stock FROM public.products WHERE id = NEW.product_id;

    IF v_old_stock IS NOT NULL THEN
        v_new_stock := v_old_stock - NEW.quantity;

        -- Update Product Stock Quantity
        UPDATE public.products
        SET stock_quantity = v_new_stock, updated_at = NOW()
        WHERE id = NEW.product_id;

        -- Create Inventory Log Entry
        INSERT INTO public.inventory_logs (tenant_id, product_id, change_type, delta_quantity, old_stock, new_stock, notes)
        VALUES (v_tenant_id, NEW.product_id, 'sale', -NEW.quantity, v_old_stock, v_new_stock, 'Auto-deducted on Invoice Sale');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_invoice_item_created
  AFTER INSERT ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.process_invoice_item_inventory();

-- 3. STORED PROCEDURE: RECORD AUDIT LOG ENTRY
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource VARCHAR(100),
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO public.audit_logs (tenant_id, user_id, action, resource, metadata)
    VALUES (p_tenant_id, p_user_id, p_action, p_resource, p_metadata)
    RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
