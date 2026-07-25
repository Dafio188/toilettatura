# 📝 Promemoria: Configurazione SMTP Supabase con Resend

Questo file serve come promemoria per configurare il server SMTP personalizzato su Supabase, risolvendo definitivamente il problema delle email di conferma/attivazione che non arrivano o vanno in spam.

---

## ⚙️ Parametri da inserire in Supabase

1. Accedi alla dashboard di **Supabase** → il tuo progetto.
2. Vai su **Settings** (icona ingranaggio in basso a sinistra) → **Authentication**.
3. Scorri fino alla sezione **SMTP Settings** e abilita l'interruttore **Enable Custom SMTP**.
4. Inserisci i seguenti campi utilizzando le credenziali di **Resend**:

| Campo | Valore da impostare | Note |
| :--- | :--- | :--- |
| **Sender Email** | `info@dogwash24.it` *(o la tua email verificata)* | Deve corrispondere al dominio verificato su Resend |
| **Sender Name** | `DogWash24` | Il nome che appare come mittente delle email |
| **Host** | `smtp.resend.com` | Il server SMTP di Resend |
| **Port** | `465` (con SSL attivo) oppure `587` (con TLS) | Porta di connessione sicura |
| **Username** | `resend` | Username fisso richiesto da Resend |
| **Password** | `re_...` *(La tua API Key di Resend)* | Inserisci l'API Key completa creata su Resend |

5. Clicca su **Save** in basso a destra.

---

## 🔗 Redirect URLs (Consigliato)
Verifica anche che nella sezione **Redirect URLs** (subito sotto la voce *SMTP Settings*) siano registrati tutti i domini autorizzati per il reindirizzamento dopo il clic sul link email:
* `http://localhost:3000/**`
* `https://app.dogwash24.it/**`
* `https://toilettatura.vercel.app/**`
