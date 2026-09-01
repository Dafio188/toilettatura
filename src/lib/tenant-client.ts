import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getTenantSubdomainFromHost } from "@/lib/tenant-host";

export function getSubdomainFromWindow(): string {
  if (typeof window === "undefined") return "";
  return getTenantSubdomainFromHost(window.location.host);
}

export async function getTenantIdFromClient(): Promise<string> {
  const subdomain = getSubdomainFromWindow();
  const defaultTenantId = "00000000-0000-0000-0000-000000000000";
  
  if (!subdomain) {
    return defaultTenantId;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data: tenant } = await (supabase.from("tenants") as any)
      .select("id")
      .eq("slug", subdomain)
      .maybeSingle();

    return (tenant as any)?.id ?? defaultTenantId;
  } catch (error) {
    console.error("Errore nel recupero del tenant_id client:", error);
    return defaultTenantId;
  }
}
