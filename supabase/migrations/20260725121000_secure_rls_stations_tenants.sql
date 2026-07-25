-- Migrazione: Hardening RLS per le tabelle public.stations e public.tenants
-- Rimuove le policy permissive USING (true) che consentivano l'enumerazione di stazioni e tenant tramite la chiave anonima.

-- ============================================================================
-- 1. SICUREZZA TABELLA public.tenants
-- ============================================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Rimuoviamo la vecchia policy permissiva
DROP POLICY IF EXISTS "Allow public read access to tenants" ON public.tenants;
DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;

-- Nuova policy: solo gli utenti autenticati del proprio tenant, admin o superadmin possono effettuare SELECT su tenants
CREATE POLICY "tenants_select_own" ON public.tenants
  FOR SELECT TO authenticated
  USING (
    id = public.current_tenant_id()
    OR public.is_admin()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false)
  );

-- ============================================================================
-- 2. SICUREZZA TABELLA public.stations
-- ============================================================================

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- Rimuoviamo le vecchie policy permissive
DROP POLICY IF EXISTS "stations_select_public" ON public.stations;
DROP POLICY IF EXISTS "stations_select_all" ON public.stations;
DROP POLICY IF EXISTS "stations_select_auth" ON public.stations;
DROP POLICY IF EXISTS "stations_select_tenant" ON public.stations;

-- Nuova policy: solo gli utenti autenticati del proprio tenant, admin o superadmin possono effettuare SELECT su stations
CREATE POLICY "stations_select_tenant" ON public.stations
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.current_tenant_id()
    OR public.is_admin()
    OR coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'superadmin', false)
  );

-- ============================================================================
-- 3. FUNZIONE SECURITY DEFINER PER LA RISOLUZIONE SUBDOMINIO IN MIDDLEWARE
-- ============================================================================

-- Consente di cercare un singolo tenant tramite slug esatto senza esporre l'intera tabella a query di enumerazione
CREATE OR REPLACE FUNCTION public.get_tenant_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  subscription_ends_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, name, slug, subscription_ends_at
  FROM public.tenants
  WHERE slug = p_slug
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_tenant_by_slug(text) TO anon, authenticated;
