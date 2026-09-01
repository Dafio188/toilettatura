"use server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sanitizeTenantBrandingInput } from "@/lib/tenant-branding";
import { buildTenantLogoStoragePath, TENANT_BRANDING_BUCKET, validateTenantLogoFile } from "@/lib/tenant-logo-upload";
import { revalidatePath } from "next/cache";

export async function updateSystemSettings(formData: FormData) {
  const { supabase, tenantId } = await requireAdmin();

  const mode = formData.get("mode") as "SELF_ONLY" | "ASSISTED_ONLY" | "HYBRID";
  const max_concurrent = parseInt(formData.get("max_concurrent_assisted") as string, 10);
  
  const enable_assisted = formData.get("enable_assisted_wash") === "on";
  const price_assisted = parseInt(formData.get("price_assisted_wash_credits") as string, 10) || 0;
  
  const enable_full = formData.get("enable_full_grooming") === "on";
  const price_full = parseInt(formData.get("price_full_grooming_credits") as string, 10) || 0;

  if (!mode || isNaN(max_concurrent) || max_concurrent < 0) {
    throw new Error("Dati non validi.");
  }

  const { error } = await (supabase.from("system_settings") as any)
    .upsert({
      tenant_id: tenantId,
      mode,
      max_concurrent_assisted: max_concurrent,
      enable_assisted_wash: enable_assisted,
      price_assisted_wash_credits: price_assisted,
      enable_full_grooming: enable_full,
      price_full_grooming_credits: price_full,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw new Error("Errore durante il salvataggio: " + error.message);
  }

  revalidatePath("/admin/impostazioni");
  revalidatePath("/admin/prenotazioni");
}

export async function updateTenantPublicBranding(formData: FormData) {
  const { tenantId } = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();

  const publicBranding = sanitizeTenantBrandingInput({
    clientDisplayName: formData.get("client_display_name"),
    logoUrl: formData.get("logo_url"),
    heroTitle: formData.get("hero_title"),
    heroSubtitle: formData.get("hero_subtitle"),
    heroDescription: formData.get("hero_description"),
    contactInfo: formData.get("contact_info"),
    showPlatformBranding: formData.get("show_platform_branding") === "on",
  });

  const { data: tenant, error: readError } = await (adminSupabase.from("tenants") as any)
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (readError) {
    throw new Error("Errore durante il caricamento del tenant: " + readError.message);
  }

  const currentSettings =
    tenant?.settings && typeof tenant.settings === "object" && !Array.isArray(tenant.settings)
      ? tenant.settings
      : {};

  const { error } = await (adminSupabase.from("tenants") as any)
    .update({
      settings: {
        ...currentSettings,
        publicBranding,
      },
    })
    .eq("id", tenantId);

  if (error) {
    throw new Error("Errore durante il salvataggio del branding pubblico: " + error.message);
  }

  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/admin/impostazioni");
}

export async function uploadTenantPublicLogo(formData: FormData) {
  const { tenantId } = await requireAdmin();
  const adminSupabase = createSupabaseAdminClient();

  const logoFile = formData.get("logo_file");
  if (!(logoFile instanceof File)) {
    throw new Error("File logo non ricevuto.");
  }

  const validation = validateTenantLogoFile(logoFile);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const path = buildTenantLogoStoragePath(tenantId, logoFile.name, logoFile.type);
  const buffer = Buffer.from(await logoFile.arrayBuffer());

  const uploadRes = await adminSupabase.storage
    .from(TENANT_BRANDING_BUCKET)
    .upload(path, buffer, {
      contentType: logoFile.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadRes.error) {
    throw new Error("Errore upload logo: " + uploadRes.error.message);
  }

  const { data: publicUrlData } = adminSupabase.storage.from(TENANT_BRANDING_BUCKET).getPublicUrl(path);
  const publicLogoUrl = publicUrlData.publicUrl;

  const { data: tenant, error: readError } = await (adminSupabase.from("tenants") as any)
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  if (readError) {
    throw new Error("Errore durante il caricamento del tenant: " + readError.message);
  }

  const currentSettings =
    tenant?.settings && typeof tenant.settings === "object" && !Array.isArray(tenant.settings)
      ? tenant.settings
      : {};

  const currentBranding =
    currentSettings.publicBranding && typeof currentSettings.publicBranding === "object" && !Array.isArray(currentSettings.publicBranding)
      ? currentSettings.publicBranding
      : {};

  const { error } = await (adminSupabase.from("tenants") as any)
    .update({
      settings: {
        ...currentSettings,
        publicBranding: {
          ...currentBranding,
          logoUrl: publicLogoUrl,
        },
      },
    })
    .eq("id", tenantId);

  if (error) {
    throw new Error("Errore durante il salvataggio del logo pubblico: " + error.message);
  }

  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/admin/impostazioni");
}
