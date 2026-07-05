# Proposta per distributori (software – hardware escluso)

Documento di riferimento per distributori di impianti self-service (lavaggio / asciugatura / toelettatura) interessati ad offrire una piattaforma completa di prenotazione, wallet crediti e gestione operativa.

Questa proposta riguarda **solo il software e i servizi** (setup, aggiornamenti, supporto). L’hardware (postazioni, lettori, gateway, tablet, relè, cablaggi, ecc.) è **escluso** e può essere fornito dal distributore o da terze parti.

## 1) Cosa risolve il software

- Prenotazioni reali con disponibilità e gestione postazioni.
- Wallet crediti, movimenti e tracciabilità.
- Dashboard cliente e dashboard admin.
- Funzionamento **anche offline** per prenotazioni + wallet (vedi sezione 4).
- Aggiornamenti e manutenzione evolutiva tramite maintenance.

## 2) Modello di distribuzione consigliato

### 2.1 Appliance on-prem per impianto
Il software viene fornito come **appliance** installata presso il cliente finale (impianto), tipicamente su mini-PC/VM gestita dal distributore.

- Ogni impianto è una installazione separata.
- La licenza è associata all’impianto (e alle sue postazioni).
- Gli aggiornamenti vengono forniti come versioni controllate (maintenance attiva).

### 2.2 Dominio cloud + accesso remoto (consigliato)
L’impianto può funzionare anche offline, ma per gestione remota, aggiornamenti e supporto è utile un dominio/host cloud.

Approcci tipici:
- Tunnel sicuro: l’appliance crea una connessione uscente verso un servizio cloud; il dominio punta al tunnel. Non richiede IP pubblico e funziona dietro NAT.
- IP pubblico + reverse proxy: il dominio punta direttamente all’impianto. Richiede rete configurata, è meno semplice e aumenta gli aspetti security.

In entrambi i casi l’operatività locale (prenotazioni + wallet offline) non dipende dal cloud quando internet manca.

### 2.3 Wallet globale multi-impianto + offline
Il cliente può utilizzare lo stesso wallet anche in impianti diversi. In assenza di internet:

- **non è consentita la ricarica** (niente topup offline)
- il credito già disponibile può essere utilizzato offline con regole di sicurezza
- al ripristino della connessione avviene l’allineamento dati e audit

## 3) Piani commerciali (SaaS)

I prezzi dei piani commerciali (IVA esclusa), basati sulle licenze d'uso della piattaforma e i servizi cloud.

### 3.0 Tabella dei Piani

| Piano | Prezzo Mensile | Prezzo Annuale (equivalente mensile) | Target Ideale |
| --- | ---: | ---: | --- |
| **START** (Licenza d'uso) | 29 €/mese | **24 €/mese** (290 €/anno) | Singolo salone che vuole ordinare l'agenda |
| **PRO** (Noleggio + Update) | 119 €/mese | **82.5 €/mese** (990 €/anno) | Saloni automatici H24 o strutture ibride |
| **ENTERPRISE** (Piattaforma) | Su misura | **Su misura** | Reti franchising e grandi impianti |

### 3.1 START (Licenza d'uso)
Adatto per saloni singoli che desiderano iniziare a gestire in modo ordinato la clientela ed abilitare il wallet digitale.
- Agenda intelligente con protezione anti-overbooking.
- Wallet crediti prepagato (pagamenti digitali Stripe, Apple Pay, Google Pay).
- Profili cane multi-pet con specifiche razza/taglia.
- Check-in QR code base per sblocco.
- Abilitazione di 1 postazione attiva nel salone.

### 3.2 PRO (Noleggio + Update)
Consigliato per saloni moderni automatici H24 o strutture ibride con o senza operatore.
- Include tutte le funzionalità del piano **START**.
- Monitoraggio sessioni live in tempo reale con timer e controllo remoto IoT delle postazioni (vasche/phon).
- Gestione operatori integrata per organizzare prenotazioni assistite o servizi speciali.
- Supporto prioritario e aggiornamenti evolutivi periodici della piattaforma inclusi.
- Abilitazione fino a 5 postazioni attive nel salone.

### 3.3 ENTERPRISE (Piattaforma completa)
Studiato per grandi distributori di impianti self-service o reti di toelettature in franchising.
- Include tutte le funzionalità del piano **PRO**.
- Numero di postazioni attive e saloni illimitato.
- Personalizzazione grafica completa e dominio personalizzato (white-label).
- Integrazioni hardware e PLC su misura per chioschi fisici o automazioni del negozio.
- Strumenti di audit e log avanzati per la sicurezza.

## 4) Funzionamento offline (prenotazioni + wallet)

L’obiettivo offline è garantire continuità di servizio anche con internet instabile.

- Prenotazioni: creazione/gestione con persistenza locale.
- Wallet: utilizzo credito già disponibile (spend-only).
- Sincronizzazione: riallineamento al ritorno online con audit.

Nota: la ricarica crediti (pagamento/incasso) richiede internet.

## 5) Cosa è incluso (Scope Funzionale del Prodotto)

### 5.1 Moduli per il CLIENTE FINALE (Pet Owner)
- **Registrazione e Accesso Sicuro (PWA)**: Accessibile istantaneamente tramite browser da smartphone (senza passare dagli app store di Apple o Google), ottimizzato come Progressive Web App per aggiungerlo con un tap alla schermata home.
- **Profili Cane Multi-Pet**: Il cliente registra uno o più cani definendo nome, razza, note particolari (es. paura del getto dell'aria calda) e la **taglia** (Piccola, Media, Grande). La taglia determina il calcolo automatico della durata del lavaggio.
- **Prenotazione Guidata e Selezione Servizi**: Interfaccia grafica "Apple Feel" che guida il cliente a scegliere la postazione (vasca o asciugatore), la data, l'ora e il tipo di servizio desiderato (Self-Service H24 o con Operatore Assistito in struttura).
- **Wallet a Crediti Prepagati**: Portafoglio virtuale ricaricabile in pochi secondi. Il cliente sceglie il pacchetto di crediti e paga in sicurezza con Stripe, Apple Pay, Google Pay o Carte di Credito.
- **QR Code di Check-in Cifrato**: Ad ogni prenotazione andata a buon fine, il sistema genera un QR Code temporizzato e crittografato. Il cliente lo scansiona all'ingresso per sbloccare la porta e attivare la postazione fisica.
- **Storico Attività e Ricevute**: Schermata per verificare i crediti residui, lo storico dei lavaggi effettuati e per scaricare le ricevute fiscali di ricarica.

### 5.2 Moduli per l'ADMIN (Gestore del Salone / Toelettatore)
- **Dashboard Operativa del Negozio**: Pannello di controllo con riepilogo grafico delle entrate giornaliere, numero di prenotazioni attive, clienti registrati e saturazione delle postazioni.
- **Monitoraggio Sessioni Live con Timer**: L'admin vede in tempo reale lo stato delle postazioni fisiche (vasche 1 e 2, tavoli, phon). Visualizza quale cane è in lavaggio, quale cliente sta usufruendo del servizio e il tempo residuo sul timer della vasca.
- **Controllo Remoto IoT**: Possibilità per l'admin di intervenire via software per avviare, sospendere o terminare forzatamente l'erogazione di acqua/phon su una specifica postazione (es. in caso di emergenza o per omaggiare minuti extra al cliente).
- **Agenda Prenotazioni e Calendario**: Gestione di tutte le prenotazioni del salone. L'admin può inserire prenotazioni manuali (es. per clienti che telefonano o entrano senza app), spostare orari o cancellare prenotazioni con rimborso crediti automatico.
- **Anagrafica Clienti e Portafoglio**: Visualizzazione di tutti i clienti del salone, i loro cani associati, i recapiti telefonici/email e la possibilità di ricaricare o scalare manualmente crediti dal loro wallet.
- **Configurazione Salone, Servizi e Tariffe**: L'admin definisce il numero di vasche/postazioni attive nel negozio, imposta gli orari di apertura, inserisce i servizi (es. shampoo speciale, cura del pelo) e associa il costo corrispondente in crediti.
- **Registro Economico (Ledger) ed Esportazione**: Tabella che traccia ogni singola operazione contabile (ricariche Stripe, acquisti fisici). Esportabile in formato CSV con un click per l'invio diretto al proprio commercialista.
- **Gestione Operatori per Servizio Assistito**: Calendario e turni dello staff del salone per organizzare gli appuntamenti in cui il cliente richiede l'assistenza diretta dell'operatore (con relativo supplemento crediti).

## 6) Cosa non è incluso (esclusioni)

- Hardware (postazioni, lettori QR/NFC, tablet kiosk, gateway, relè, PLC, cablaggi, ecc.).
- Installazione elettrica e certificazioni.
- Pagamenti reali (es. integrazione POS/Stripe) se non concordati come progetto separato.
- Personalizzazioni “white-label” (brand completamente separato) salvo accordi dedicati.

## 7) Requisiti minimi (impianto)

### 7.1 Infrastruttura
- Un mini-PC/VM per l’appliance (specifiche definite in base al carico).
- Rete locale stabile (LAN).
- Connessione internet consigliata, non obbligatoria per l’operatività base.

### 7.2 Regole offline (wallet globale)
Per un wallet globale multi-impianto in offline si applicano regole per ridurre “double spending” e conflitti:

- Nessuna ricarica offline.
- Utilizzo offline consentito solo entro soglie definite (policy concordate).
- Audit log completo di movimenti wallet, prenotazioni e anomalie.
- In caso di conflitto alla sincronizzazione: si applica una policy concordata (ad es. blocco e revisione admin).

## 8) Sicurezza e anti-copia (principi)

Obiettivo: garantire la massima integrità dei dati, impedire copie non autorizzate e proteggere le comunicazioni.

- **Politiche di Sicurezza HTTP avanzate**: Adozione di header di protezione rigorosi (`Strict-Transport-Security` / HSTS a 1 anno, `Content-Security-Policy` / CSP ottimizzata per proteggere le connessioni esterne del sito, `X-Frame-Options` anti-clickjacking, `Permissions-Policy` per protezione hardware, e rimozione delle intestazioni software `X-Powered-By`).
- Installazione per impianto tramite appliance.
- Licenza per impianto e per numero postazioni.
- Aggiornamenti disponibili solo con maintenance attiva.
- Telemetria minima (non invasiva) per integrità, duplicati e supporto.
- Watermark nei report/export (ID impianto/partner) per tracciabilità.

## 9) Processo di onboarding (tipico)

1. Raccolta dati impianto (postazioni, servizi, prezzi, orari, regole).
2. Installazione appliance e configurazione base.
3. Import o creazione postazioni (fino a 5 incluse nello Standard).
4. Test online/offline + flusso prenotazione/wallet.
5. Formazione operativa e consegna procedure.
6. Go-live e supporto di avvio.

## 10) Supporto e SLA (indicativo)

- Standard: supporto in orario lavorativo, best effort, priorità bug bloccanti.
- Pro: priorità alta, canale dedicato, aggiornamenti assistiti e procedure rollback.

## 11) Opzioni future (su richiesta)

- Attivazione postazioni tramite QR (check-in) con sessioni e timer automatico.
- App kiosk dedicata per tablet di postazione.
- Gateway certificato per controllo macchine (anti-copia e controllo accessi).
- Integrazione pagamenti reali (POS, Stripe, ecc.).
- Portale partner per distributori (gestione rete clienti/impianti).

## 12) Note legali / licenza d’uso (principi)

Il software viene concesso in licenza d’uso:
- per impianto
- con limite postazioni
- con maintenance per aggiornamenti e supporto

Non è prevista la cessione completa del codice sorgente in questa formula standard (salvo accordi enterprise dedicati).

## 13) Modulo di Amministrazione Piattaforma (Riservato Superadmin - ESCLUSO DAL VIDEO)
Questa sezione è riservata unicamente al proprietario dell'infrastruttura SaaS globale (Davide) per la gestione commerciale e non fa parte del prodotto salone/cliente. Non deve essere inclusa nella sceneggiatura o nel video esplicativo.

- **CRM Gestione Richieste (Leads)**: Pannello integrato per tracciare le richieste dei toelettatori interessati ad aprire una licenza DogWash24, con gestione a 5 stati operativi (*Nuovo*, *Contattato*, *In trattativa*, *Da ricontattare*, *Chiuso/Firmato*).
- **Automazione Email Partner (Resend)**: Invio automatico di notifiche in tempo reale al superadmin alla ricezione di nuove richieste dal modulo contatti del sito vetrina, e contestuale email di benvenuto al partner con il riepilogo del piano d'interesse.
- **Gestione Tenant e Sotto-domini**: Pannello per attivare nuovi saloni, associare i relativi sotto-domini (`slug.app.dogwash24.it`), impostare scadenze e gestire la revoca automatica della licenza.
