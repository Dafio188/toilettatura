/**
 * Modulo per l'invio di messaggi WhatsApp
 * Configura queste variabili nel file .env.local:
 * 
 * WHATSAPP_API_URL=https://api.ultramsg.com/instanceXXX/messages/chat
 * WHATSAPP_API_TOKEN=tuo_token
 * WHATSAPP_PROVIDER=ultramsg // oppure "meta", "twilio"
 */

type SendWhatsAppParams = {
  to: string; // Formato E.164 o con country code (es. +393331234567)
  message: string;
  templateName?: string;
  templateParams?: string[];
};

export async function sendWhatsAppMessage({ to, message, templateName, templateParams }: SendWhatsAppParams) {
  const url = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  const provider = process.env.WHATSAPP_PROVIDER || "ultramsg";

  if (!url || !token) {
    console.warn("⚠️ WhatsApp non configurato. Variabili d'ambiente mancanti. Simulazione invio...");
    console.log(`[WHATSAPP SIMULATED] A: ${to}\nMessaggio:\n${message}`);
    return { success: true, simulated: true };
  }

  // Formatta il numero (es. rimuove il + per Ultramsg o per Meta)
  let cleanPhone = to.replace(/[^0-9]/g, "");

  // Se è un numero italiano di 9 o 10 cifre che inizia con '3' (classico cellulare),
  // aggiungiamo automaticamente il prefisso internazionale '39' richiesto da Ultramsg.
  if (cleanPhone.length >= 9 && cleanPhone.length <= 10 && cleanPhone.startsWith("3")) {
    cleanPhone = "39" + cleanPhone;
  }

  try {
    if (provider === "ultramsg") {
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("to", cleanPhone);
      params.append("body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Errore API WhatsApp: ${response.statusText}`);
      }

      return { success: true, simulated: false };
    }
    
    if (provider === "meta") {
      const payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanPhone,
      };

      if (templateName) {
        payload.type = "template";
        payload.template = {
          name: templateName,
          language: {
            code: "it",
          },
          components: [
            {
              type: "body",
              parameters: (templateParams ?? []).map((param) => ({
                type: "text",
                text: param,
              })),
            },
          ],
        };
      } else {
        payload.type = "text";
        payload.text = {
          preview_url: false,
          body: message,
        };
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          `Errore API Meta WhatsApp: ${response.statusText}. Dettagli: ${JSON.stringify(errData)}`
        );
      }

      return { success: true, simulated: false };
    }

    throw new Error("Provider WhatsApp non supportato.");
  } catch (error) {
    console.error("Errore invio WhatsApp:", error);
    return { success: false, error: (error as Error).message };
  }
}
