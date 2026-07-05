"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const leadSchema = z.object({
  name: z.string().min(2, "Il nome deve contenere almeno 2 caratteri"),
  email: z.string().email("Inserisci un indirizzo email valido"),
  phone: z.string().min(5, "Inserisci un numero di telefono valido"),
  salonName: z.string().optional(),
  city: z.string().optional(),
  planInterest: z.enum(["START", "PRO", "ENTERPRISE"]).optional(),
  notes: z.string().optional(),
});

export async function submitLeadAction(formData: z.infer<typeof leadSchema>) {
  try {
    // 1. Valida i dati
    const validated = leadSchema.parse(formData);

    // 2. Salva nel DB Supabase (usando il service role per bypassare le RLS)
    const adminSupabase = createSupabaseAdminClient() as any;
    const { data, error } = await adminSupabase
      .from("marketing_leads")
      .insert({
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        salon_name: validated.salonName || null,
        city: validated.city || null,
        plan_interest: validated.planInterest || null,
        notes: validated.notes || null,
        status: "new",
      })
      .select()
      .single();

    if (error) {
      console.error("Errore salvataggio lead in Supabase:", error.message);
      return { success: false, error: "Impossibile salvare i dati nel database." };
    }

    console.log(`[LEAD] ✅ Lead salvato: id=${data.id} | email=${validated.email} | piano=${validated.planInterest ?? "N/D"}`);

    // 3. Invio notifica email a info@dogwash24.it via Resend REST API
    const resendApiKey = process.env.RESEND_API_KEY;
    const emailFrom = process.env.RESEND_FROM_EMAIL;

    if (!resendApiKey) {
      console.warn("[EMAIL] ⚠️  RESEND_API_KEY non definita — email saltata.");
    } else if (!emailFrom) {
      console.error("[EMAIL] ❌ RESEND_FROM_EMAIL non definita su Vercel. Aggiungila nelle env vars con valore: noreply@dogwash24.it");
    }

    if (resendApiKey && emailFrom) {
      console.log(`[EMAIL] 📧 Invio notifica a info@dogwash24.it (from: ${emailFrom})...`);
      try {
        const emailTo = "info@dogwash24.it";

        const adminHtmlContent = `
          <h2>Nuova richiesta contatto ricevuta!</h2>
          <p>Un nuovo toelettatore si è registrato sul sito DogWash24.</p>
          <table border="0" cellpadding="8" cellspacing="0" style="border-collapse: collapse; font-family: sans-serif;">
            <tr><td><b>Nome Referente:</b></td><td>${validated.name}</td></tr>
            <tr><td><b>Nome Salone:</b></td><td>${validated.salonName || "Non specificato"}</td></tr>
            <tr><td><b>Email:</b></td><td><a href="mailto:${validated.email}">${validated.email}</a></td></tr>
            <tr><td><b>Telefono:</b></td><td><a href="tel:${validated.phone}">${validated.phone}</a></td></tr>
            <tr><td><b>Città/Provincia:</b></td><td>${validated.city || "Non specificata"}</td></tr>
            <tr><td><b>Piano di interesse:</b></td><td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${validated.planInterest || "Nessuno"}</span></td></tr>
            ${validated.notes ? `<tr><td><b>Messaggio/Note:</b></td><td>${validated.notes}</td></tr>` : ""}
          </table>
          <br/>
          <hr/>
          <p style="font-size: 12px; color: #666;">Questo lead è stato salvato nel database ed è gestibile dalla tua <a href="https://app.dogwash24.it/superadmin">Dashboard Superadmin</a>.</p>
        `;

        // 3.1 Invio email agli admin
        const mailResAdmin = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `DogWash24 Leads <${emailFrom}>`,
            to: emailTo,
            subject: `Nuovo Lead: ${validated.salonName || validated.name} (${validated.planInterest || "Richiesta"})`,
            html: adminHtmlContent,
          }),
        });

        if (!mailResAdmin.ok) {
          const errData = await mailResAdmin.json();
          console.error(`[EMAIL ADMIN] ❌ Resend HTTP ${mailResAdmin.status}:`, JSON.stringify(errData));
        } else {
          const resendData = await mailResAdmin.json().catch(() => ({}));
          console.log(`[EMAIL ADMIN] ✅ Email inviata con successo! Resend message ID: ${resendData?.id ?? "N/D"}`);
        }

        // 3.2 Invio email di conferma al cliente
        console.log(`[EMAIL CLIENTE] 📧 Invio conferma a ${validated.email}...`);
        const clientHtmlContent = `
          <h2>Grazie per averci contattato, ${validated.name}!</h2>
          <p>Abbiamo ricevuto la tua richiesta di informazioni per il piano <b>${validated.planInterest || "selezionato"}</b>.</p>
          <p>Un nostro consulente analizzerà la tua richiesta e ti contatterà al più presto all'indirizzo email o al numero di telefono fornito.</p>
          <br/>
          <p>A presto,<br/>Il team di DogWash24</p>
        `;

        const mailResClient = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `DogWash24 <${emailFrom}>`,
            to: validated.email,
            subject: "Abbiamo ricevuto la tua richiesta - DogWash24",
            html: clientHtmlContent,
          }),
        });

        if (!mailResClient.ok) {
          const errData = await mailResClient.json();
          console.error(`[EMAIL CLIENTE] ❌ Resend HTTP ${mailResClient.status}:`, JSON.stringify(errData));
        } else {
          const resendData = await mailResClient.json().catch(() => ({}));
          console.log(`[EMAIL CLIENTE] ✅ Email inviata con successo! Resend message ID: ${resendData?.id ?? "N/D"}`);
        }

      } catch (mailErr) {
        console.error("Errore critico durante l'invio delle notifiche email:", mailErr);
      }
    }

    return { success: true, leadId: data.id };
  } catch (err) {
    console.error("Errore Server Action:", err);
    if (err instanceof z.ZodError) {
      return { success: false, error: err.issues[0]?.message || "Dati non validi." };
    }
    return { success: false, error: "Si è verificato un errore imprevisto." };
  }
}
