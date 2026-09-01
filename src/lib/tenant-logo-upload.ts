export const TENANT_BRANDING_BUCKET = "branding";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function getSafeLogoExtension(filename: string, mimeType: string) {
  const lowerName = filename.toLowerCase();
  if (mimeType === "image/png" || lowerName.endsWith(".png")) return "png";
  if (mimeType === "image/webp" || lowerName.endsWith(".webp")) return "webp";
  return "jpg";
}

export function validateTenantLogoFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!file || file.size <= 0) {
    return { ok: false, error: "Seleziona un file immagine da caricare." };
  }

  if (!SUPPORTED_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "Il logo deve essere un'immagine PNG, JPG o WEBP." };
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return { ok: false, error: "Il logo supera il limite di 2 MB." };
  }

  return { ok: true };
}

export function buildTenantLogoStoragePath(tenantId: string, filename: string, mimeType = "") {
  const ext = getSafeLogoExtension(filename, mimeType);
  return `tenant-branding/${tenantId}/logo.${ext}`;
}
