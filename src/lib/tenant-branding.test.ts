import test from "node:test";
import assert from "node:assert/strict";

const tenantBrandingModule = await import(new URL("./tenant-branding.ts", import.meta.url).href);
const { normalizeTenantPublicBranding, sanitizeTenantBrandingInput } = tenantBrandingModule;

test("normalizeTenantPublicBranding returns DogWash24 fallback values", () => {
  const branding = normalizeTenantPublicBranding({}, "Paw Spa Milano");

  assert.equal(branding.tenantName, "Paw Spa Milano");
  assert.equal(branding.clientDisplayName, "Paw Spa Milano");
  assert.equal(branding.platformDisplayName, "DogWash24");
  assert.equal(branding.showPlatformBranding, true);
  assert.equal(branding.logoUrl, null);
  assert.match(branding.heroTitle, /Paw Spa Milano/);
});

test("sanitizeTenantBrandingInput trims values and rejects unsupported logo hosts", () => {
  const input = sanitizeTenantBrandingInput({
    clientDisplayName: "  Boutique Pelo  ",
    logoUrl: "https://example.com/logo.png",
    heroTitle: "  Il tuo salone di fiducia  ",
    heroDescription: "  Prenota online in pochi secondi.  ",
    contactInfo: "  Via Roma 10  ",
    showPlatformBranding: false,
  });

  assert.equal(input.clientDisplayName, "Boutique Pelo");
  assert.equal(input.logoUrl, null);
  assert.equal(input.heroTitle, "Il tuo salone di fiducia");
  assert.equal(input.heroDescription, "Prenota online in pochi secondi.");
  assert.equal(input.contactInfo, "Via Roma 10");
  assert.equal(input.showPlatformBranding, false);
});

test("sanitizeTenantBrandingInput accepts local and Supabase logo URLs", () => {
  const local = sanitizeTenantBrandingInput({ logoUrl: "/tenant-logo.png" });
  const remote = sanitizeTenantBrandingInput({
    logoUrl: "https://abcd.supabase.co/storage/v1/object/public/branding/logo.png",
  });

  assert.equal(local.logoUrl, "/tenant-logo.png");
  assert.equal(remote.logoUrl, "https://abcd.supabase.co/storage/v1/object/public/branding/logo.png");
});
