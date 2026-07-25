# 💬 Promemoria: Configurazione WhatsApp con Meta Cloud API (Ufficiale)

Questo file serve come promemoria e guida per configurare il canale di notifica WhatsApp centralizzato tramite le API Graph ufficiali di Meta, risolvendo le notifiche per prenotazioni e lista d'attesa (overbooking).

---

## ⚙️ Parametri da aggiungere nel file `.env.local`

Apri il file `.env.local` nella radice del progetto e configura le seguenti variabili per abilitare l'invio ufficiale tramite Meta:

```env
# ------------------------------------------------------------------------------
# CONFIGURAZIONE WHATSAPP (Meta Cloud API)
# ------------------------------------------------------------------------------
WHATSAPP_PROVIDER=meta
# Sostituisci IL_TUO_PHONE_NUMBER_ID con l'ID numerico che trovi nella dashboard Meta Developers
WHATSAPP_API_URL=https://graph.facebook.com/v18.0/IL_TUO_PHONE_NUMBER_ID/messages
# Il Token di accesso permanente (System User Access Token) generato sul tuo Business Manager
WHATSAPP_API_TOKEN=EAAB...
```

> [!NOTE]
> * Se queste variabili rimangono vuote o non configurate, il sistema simulerà l'invio nei log del server senza generare errori bloccanti.

---

## 📋 Creazione dei Template in WhatsApp Business Manager

Poiché i messaggi sono avviati dall'applicazione (Out-of-Window), Meta richiede obbligatoriamente l'uso di modelli (template) pre-approvati. Devi creare ed approvare questi due template nella tua console di WhatsApp Business:

### 1️⃣ Template: `conferma_prenotazione`
* **Categoria**: Utility (Utilità)
* **Lingua**: Italiano (`it`)
* **Testo del Modello**:
  > 🐾 \*DogWash24 - Prenotazione Confermata!\*\n\nCiao! Ti confermiamo l'appuntamento per \*{{1}}\*.\n\n🗓️ Quando: {{2}}\n📍 Postazione: {{3}}\n✂️ Servizio: {{4}}\n\nTi aspettiamo!

---

### 2️⃣ Template: `notifica_lista_attesa`
* **Categoria**: Utility (Utilità)
* **Lingua**: Italiano (`it`)
* **Testo del Modello**:
  > 🐾 \*Posto Libero da DogWash24!\*\n\nCiao {{1}}! Si è liberato uno slot per la giornata di oggi:\n\n🗓️ {{2}}\n📍 Postazione: {{3}}\n\nSe sei ancora interessato, prenota subito cliccando qui:\n🔗 {{4}}

---

## 🧪 Come testare il funzionamento

1. Esegui l'accesso alla piattaforma locale (`npm run dev`).
2. Verifica che i template siano in stato **Approved** (Approvato) all'interno del pannello Meta.
3. Assicurati che il tuo account di test abbia un numero di telefono salvato sul profilo.
4. Esegui una prenotazione: il sistema manderà la chiamata a Meta che invierà il messaggio pre-compilato con i dati dinamici.
