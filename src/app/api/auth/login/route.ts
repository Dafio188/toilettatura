import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Estrazione IP del client per il rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? (forwardedFor.split(",")[0]?.trim() || "127.0.0.1") : "127.0.0.1";

    let email = "";
    let password = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => new FormData());
      email = String(formData.get("email") ?? "");
      password = String(formData.get("password") ?? "");
    } else {
      const body = await request.json().catch(() => ({}));
      email = String(body.email ?? "");
      password = String(body.password ?? "");
    }

    if (!email.trim() || !password) {
      return NextResponse.json(
        { error: "Inserisci email e password." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 2. Controllo Rate Limit sia su IP che sull'indirizzo Email target (max 5 tentativi al minuto)
    const ipRateLimit = checkRateLimit(`login:ip:${clientIp}`, { maxRequests: 5, intervalMs: 60 * 1000 });
    const emailRateLimit = checkRateLimit(`login:email:${cleanEmail}`, { maxRequests: 5, intervalMs: 60 * 1000 });

    if (ipRateLimit.isRateLimited || emailRateLimit.isRateLimited) {
      const resetSeconds = Math.ceil(
        (Math.max(ipRateLimit.resetTimeMs, emailRateLimit.resetTimeMs) - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          error: `Troppi tentativi di accesso falliti. Per ragioni di sicurezza, attendi ${resetSeconds} secondi prima di riprovare.`,
          retryAfter: resetSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(resetSeconds),
          },
        }
      );
    }

    // 3. Esecuzione login tramite Supabase Server Client
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Credenziali non valide." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
      session: data.session,
    });
  } catch (err: any) {
    console.error("[API Auth Login] Errore inatteso:", err);
    return NextResponse.json(
      { error: "Si è verificato un errore durante l'autenticazione. Riprova." },
      { status: 500 }
    );
  }
}
