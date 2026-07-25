import fs from 'fs';
import path from 'path';

// 1. Carica le variabili da .env.local manualmente
const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error("File .env.local non trovato.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const url = env.WHATSAPP_API_URL;
const token = env.WHATSAPP_API_TOKEN;
const provider = env.WHATSAPP_PROVIDER;

console.log("=== CONFIGURAZIONE RILEVATA ===");
console.log("Provider:", provider);
console.log("URL:", url);
console.log("Token configurato:", token ? "SÌ (lunghezza: " + token.length + ")" : "NO");
console.log("===============================\n");

if (!url || !token) {
  console.error("Errore: WHATSAPP_API_URL o WHATSAPP_API_TOKEN mancanti in .env.local");
  process.exit(1);
}

const recipient = "393926600661";

// Usiamo il template standard "hello_world" approvato da Meta su ogni account
const payload = {
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: recipient,
  type: "template",
  template: {
    name: "hello_world",
    language: {
      code: "en_US"
    }
  }
};

console.log("Invio richiesta a Meta in corso...");
try {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log("RISPOSTA DA META:");
  console.log("Status:", res.status, res.statusText);
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("Errore durante la chiamata fetch:", error);
}
