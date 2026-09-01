import test from "node:test";
import assert from "node:assert/strict";

const tenantLogoModule = await import(new URL("./tenant-logo-upload.ts", import.meta.url).href);
const { buildTenantLogoStoragePath, validateTenantLogoFile } = tenantLogoModule;

test("validateTenantLogoFile accepts PNG logo within size limit", () => {
  const file = new File([new Uint8Array(1024)], "logo principale.PNG", { type: "image/png" });
  const result = validateTenantLogoFile(file);

  assert.equal(result.ok, true);
});

test("validateTenantLogoFile rejects unsupported mime type", () => {
  const file = new File([new Uint8Array(1024)], "logo.svg", { type: "image/svg+xml" });
  const result = validateTenantLogoFile(file);

  assert.equal(result.ok, false);
  assert.match(result.error, /PNG, JPG o WEBP/);
});

test("buildTenantLogoStoragePath creates deterministic tenant path with safe extension", () => {
  const path = buildTenantLogoStoragePath("tenant-123", "Il Mio Logo Finale.JPG");

  assert.equal(path, "tenant-branding/tenant-123/logo.jpg");
});
