import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type TenantRow = Database["public"]["Tables"]["tenants"]["Row"];

export async function getTenantFromHost(options?: { base?: boolean }): Promise<TenantRow | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  // Esempio host: pawspa.dogwash24.it, pawspa.localhost:3000, localhost:3000
  const domainParts = host.split(".");
  let subdomain = "";
  
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    const parts = host.split(":");
    const part0 = parts[0];
    if (part0) {
      const localParts = part0.split(".");
      if (localParts.length > 1) {
        subdomain = localParts[0] || "";
      }
    }
  } else {
    // Es: pawspa.dogwash24.it -> parts: ['pawspa', 'dogwash24', 'it']
    if (domainParts.length >= 3) {
      const sub = domainParts[0] || "";
      if (sub !== "www" && sub !== "app") {
        subdomain = sub;
      }
    }
  }

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
