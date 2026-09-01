export function getTenantSubdomainFromHost(host: string): string {
  const normalizedHost = host.trim().toLowerCase();
  if (!normalizedHost) return "";

  if (normalizedHost.endsWith(".vercel.app")) {
    return "";
  }

  if (normalizedHost.includes("localhost") || normalizedHost.includes("127.0.0.1")) {
    const parts = normalizedHost.split(":");
    const localParts = (parts[0] || "").split(".");
    if (localParts.length > 1) {
      return localParts[0] || "";
    }
    return "";
  }

  const domainParts = normalizedHost.split(".");
  if (domainParts.length >= 3) {
    const sub = domainParts[0] || "";
    if (sub !== "www" && sub !== "app") {
      return sub;
    }
  }

  return "";
}
