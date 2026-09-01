import test from "node:test";
import assert from "node:assert/strict";

const tenantHostModule = await import(new URL("./tenant-host.ts", import.meta.url).href);

const { getTenantSubdomainFromHost } = tenantHostModule;

test("getTenantSubdomainFromHost ignores vercel platform host", () => {
  assert.equal(getTenantSubdomainFromHost("toilettatura.vercel.app"), "");
});

test("getTenantSubdomainFromHost extracts tenant from customer subdomain host", () => {
  assert.equal(getTenantSubdomainFromHost("pawspa.dogwash24.it"), "pawspa");
});
