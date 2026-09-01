import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTenantSubdomainFromHost } from "@/lib/tenant-host";
import type { Database } from "@/types/database";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

export async function getTenantFromHost(options?: { base?: boolean }): Promise<TenantRow | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const subdomain = getTenantSubdomainFromHost(host);

  const supabase = await createSupabaseServerClient({ base: options?.base });

  if (subdomain) {
    const { data: tenantRes } = await (supabase as any).rpc("get_tenant_by_slug", { p_slug: subdomain });
    const tenant = Array.isArray(tenantRes) ? tenantRes[0] : tenantRes;
    if (tenant) {
      return tenant as TenantRow;
    }
  }

  // Fallback: carichiamo il tenant di default (quello preesistente per i dati storici)
  const { data: defaultRes } = await (supabase as any).rpc("get_tenant_by_slug", { p_slug: "default" });
  const defaultTenant = Array.isArray(defaultRes) ? defaultRes[0] : defaultRes;

  return (defaultTenant as TenantRow) || null;
}
