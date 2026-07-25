/**
 * Sanitizza i parametri di reindirizzamento (es. ?next=/dashboard)
 * per prevenire vulnerabilità di Open Redirect verso domini esterni dannosi (es. //evil.com o /\evil.com).
 */
export function safeNextPath(value: unknown, fallback: string = "/"): string {
  if (typeof value !== "string" || !value) return fallback;
  const trimmed = value.trim();

  // Deve iniziare con '/' e NON con '//', '/\' o '\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\") || trimmed.startsWith("\\")) {
    return fallback;
  }

  try {
    const url = new URL(trimmed, "http://localhost");
    // Verifica che l'hostname rimanga ristretto al relativo locale
    if (url.hostname !== "localhost" || url.protocol !== "http:") {
      return fallback;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
