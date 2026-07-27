-- ==============================================================================
-- OMNIPOS SAAS POS BILLING PLATFORM - MULTI-TENANT RLS POLICIES MIGRATION
-- Migration ID: 20260727000002_rls_policies
-- Target DB Engine: PostgreSQL / Supabase
-- ==============================================================================

-- Enable RLS on ALL 19 Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Helper Context Function: Returns array of active tenant IDs for the current authenticated user
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids()
RETURNS TABLE (tenant_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT tu.tenant_id
    FROM public.tenant_users tu
    WHERE tu.user_id = auth.uid() AND tu.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE USING (id = auth.uid());

-- 2. TENANTS POLICIES
CREATE POLICY "Tenant members can view store details"
ON public.tenants FOR SELECT USING (id IN (SELECT get_user_tenant_ids()));

-- 3. TENANT USERS POLICIES
CREATE POLICY "Members can view staff in same tenant"
ON public.tenant_users FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 4. SUBSCRIPTIONS POLICIES
CREATE POLICY "Members can view tenant subscription"
ON public.subscriptions FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 5. CATEGORIES POLICIES
CREATE POLICY "Tenant category access"
ON public.categories FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 6. PRODUCTS POLICIES
CREATE POLICY "Tenant product access"
ON public.products FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 7. CUSTOMERS POLICIES
CREATE POLICY "Tenant customer access"
ON public.customers FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 8. INVOICES POLICIES
CREATE POLICY "Tenant invoice access"
ON public.invoices FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 9. INVOICE ITEMS POLICIES
CREATE POLICY "Tenant invoice items access"
ON public.invoice_items FOR ALL USING (
    invoice_id IN (SELECT id FROM public.invoices WHERE tenant_id IN (SELECT get_user_tenant_ids()))
);

-- 10. SUPPLIERS POLICIES
CREATE POLICY "Tenant supplier access"
ON public.suppliers FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 11. PURCHASES POLICIES
CREATE POLICY "Tenant purchase access"
ON public.purchases FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 12. EXPENSES POLICIES
CREATE POLICY "Tenant expense access"
ON public.expenses FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 13. INVENTORY LOGS POLICIES
CREATE POLICY "Tenant inventory log access"
ON public.inventory_logs FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 14. PAYMENTS POLICIES
CREATE POLICY "Tenant payment access"
ON public.payments FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 15. NOTIFICATIONS POLICIES
CREATE POLICY "Tenant notification access"
ON public.notifications FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 16. SETTINGS POLICIES
CREATE POLICY "Tenant settings access"
ON public.tenant_settings FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 17. AUDIT LOGS POLICIES
CREATE POLICY "Tenant audit log view access"
ON public.audit_logs FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

-- 18. COUPONS POLICIES
CREATE POLICY "Tenant coupons access"
ON public.coupons FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()) OR tenant_id IS NULL);

-- 19. AI USAGE LOGS POLICIES
CREATE POLICY "Tenant AI usage access"
ON public.ai_usage_logs FOR ALL USING (tenant_id IN (SELECT get_user_tenant_ids()));
