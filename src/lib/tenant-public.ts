import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTenantFromHost } from "@/lib/tenant";
import { normalizeTenantPublicBranding, type TenantPublicBranding } from "@/lib/tenant-branding";

export type TenantPublicContext = {
  tenantId: string;
  slug: string;
  branding: TenantPublicBranding;
};

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000000";

export async function getTenantPublicContext(): Promise<TenantPublicContext> {
  const hostTenant = await getTenantFromHost({ base: true });
  const fallbackBranding = normalizeTenantPublicBranding({}, hostTenant?.name ?? "DogWash24");

  if (!hostTenant?.id) {
    return {
      tenantId: DEFAULT_TENANT_ID,
      slug: "default",
      branding: fallbackBranding,
    };
  }

  try {
    const adminSupabase = createSupabaseAdminClient();
    const { data } = await (adminSupabase.from("tenants") as any)
      .select("id, name, slug, settings")
      .eq("id", hostTenant.id)
      .maybeSingle();

    const tenantName = data?.name ?? hostTenant.name ?? "DogWash24";
    const slug = data?.slug ?? hostTenant.slug ?? "default";

    return {
      tenantId: data?.id ?? hostTenant.id,
      slug,
      branding: normalizeTenantPublicBranding(data?.settings?.publicBranding, tenantName),
    };
  } catch {
    return {
      tenantId: hostTenant.id,
      slug: hostTenant.slug ?? "default",
      branding: fallbackBranding,
    };
  }
}
