[OPEN] Debug session: dog-create-403

# Sintomo
- Utente autenticato.
- Salvataggio nuovo cane fallisce con `POST /rest/v1/dogs` -> `403 Forbidden`.
- Browser mostra anche errore del service worker su `/cani/nuovo`, probabilmente secondario al fallimento principale.

# Ipotesi iniziali
1. Manca o fallisce una policy RLS `INSERT` sulla tabella `dogs`.
2. La insert invia un `tenant_id` o `customer_id` non coerente con l'utente autenticato.
3. Il client sta usando una chiave/sessione valida per login ma non propagata correttamente alla richiesta `dogs`.
4. Esiste un trigger/vincolo che dipende da `auth.uid()` o `tenant_id` e porta la richiesta a essere rifiutata come `403`.
5. Il service worker sta mascherando il vero errore di rete, ma la causa primaria resta lato Supabase policy/autorizzazione.

# Piano
1. Ispezionare il codice del form e il percorso di insert.
2. Verificare schema/policy sulla tabella `dogs`.
3. Aggiungere strumentazione minima se la causa non emerge dai controlli diretti.
4. Riprodurre/fissare con test mirato.
5. Verificare il comportamento dopo la correzione.

# Evidenze raccolte
- Il browser restituisce `new row violates row-level security policy for table "dogs"`.
- La policy `dogs_insert_own` richiede `owner_id = auth.uid() AND tenant_id = public.current_tenant_id()`.
- `public.current_tenant_id()` legge l'header `x-tenant-id`.
- Il browser Supabase invia `x-tenant-id` prendendolo dal cookie `current_tenant_id`.
- Sul dominio `toilettatura.vercel.app` la risoluzione host interpretava `toilettatura` come slug tenant invece che come dominio piattaforma, quindi il cookie tenant non veniva valorizzato col fallback `default`.

# Conclusione corrente
- Causa confermata: parsing host errato su dominio Vercel piattaforma, con perdita del tenant corrente nel browser e conseguente blocco RLS sugli insert in `dogs`.
- Correzione applicata nel parsing host condiviso tra middleware, client browser, callback auth e risoluzione tenant server.
- Stato: in attesa di verifica utente su ambiente reale.
