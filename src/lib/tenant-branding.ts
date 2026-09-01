export type TenantBrandingSettingsInput = {
  clientDisplayName?: unknown;
  logoUrl?: unknown;
  heroTitle?: unknown;
  heroSubtitle?: unknown;
  heroDescription?: unknown;
  contactInfo?: unknown;
  showPlatformBranding?: unknown;
};

export type TenantBrandingSettings = {
  clientDisplayName: string | null;
  logoUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  heroDescription: string | null;
  contactInfo: string | null;
  showPlatformBranding: boolean;
};

export type TenantPublicBranding = TenantBrandingSettings & {
  tenantName: string;
  platformDisplayName: string;
  clientDisplayName: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
};

const PLATFORM_DISPLAY_NAME = "DogWash24";
const DEFAULT_TENANT_NAME = "DogWash24";

function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function isAllowedTenantLogoUrl(value: string) {
  if (!value) return false;
  if (value.startsWith("/")) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

export function sanitizeTenantBrandingInput(input: unknown): TenantBrandingSettings {
  const source = (input && typeof input === "object" ? input : {}) as TenantBrandingSettingsInput;
  const logoCandidate = sanitizeText(source.logoUrl, 600);

  return {
    clientDisplayName: sanitizeText(source.clientDisplayName, 80),
    logoUrl: logoCandidate && isAllowedTenantLogoUrl(logoCandidate) ? logoCandidate : null,
    heroTitle: sanitizeText(source.heroTitle, 120),
    heroSubtitle: sanitizeText(source.heroSubtitle, 140),
    heroDescription: sanitizeText(source.heroDescription, 320),
    contactInfo: sanitizeText(source.contactInfo, 180),
    showPlatformBranding: source.showPlatformBranding !== false,
  };
}

function normalizeTenantName(tenantName: string | null | undefined) {
  const cleanName = sanitizeText(tenantName, 80);
  if (!cleanName || cleanName === "DogWash24 Default") {
    return DEFAULT_TENANT_NAME;
  }
  return cleanName;
}

export function normalizeTenantPublicBranding(input: unknown, tenantName: string | null | undefined): TenantPublicBranding {
  const sanitized = sanitizeTenantBrandingInput(input);
  const resolvedTenantName = normalizeTenantName(tenantName);
  const displayName = sanitized.clientDisplayName || resolvedTenantName;

  return {
    tenantName: resolvedTenantName,
    platformDisplayName: PLATFORM_DISPLAY_NAME,
    clientDisplayName: displayName,
    logoUrl: sanitized.logoUrl,
    heroTitle: sanitized.heroTitle || `${displayName} su ${PLATFORM_DISPLAY_NAME}`,
    heroSubtitle: sanitized.heroSubtitle || "Prenota il servizio del tuo salone in pochi passaggi, quando vuoi.",
    heroDescription:
      sanitized.heroDescription ||
      "Accedi alla tua area personale per gestire profili cane, credito e prenotazioni del negozio selezionato.",
    contactInfo: sanitized.contactInfo,
    showPlatformBranding: sanitized.showPlatformBranding,
  };
}
