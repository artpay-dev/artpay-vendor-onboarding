# Supabase Schema - Artpay Vendor Onboarding

Questa cartella contiene le migrazioni del database Supabase per il sistema di onboarding vendor.

## 📁 Struttura

```
supabase/
├── migrations/
│   ├── 001_create_onboarding_tables.sql  # Schema principale
│   ├── 002_add_rls_policies.sql          # Row Level Security
│   └── 003_seed_data.sql                  # Dati di test (opzionale)
└── README.md
```

## 🚀 Come Applicare le Migrazioni

### Opzione 1: Supabase CLI (Raccomandato)

```bash
# Installa Supabase CLI se non l'hai già fatto
npm install -g supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref your-project-ref

# Applica le migrazioni
supabase db push
```

### Opzione 2: Dashboard Supabase

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **SQL Editor**
4. Copia e incolla il contenuto di ogni file `.sql` in ordine
5. Esegui ogni script

### Opzione 3: API Supabase

```bash
# Usando curl (richiede API key)
curl -X POST 'https://your-project.supabase.co/rest/v1/rpc' \
  -H "apikey: YOUR_SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "SQL_CONTENT_HERE"}'
```

## 📊 Tabelle Create

### 1. `vendor_onboardings`
Tabella principale che traccia tutto il processo di onboarding.

**Stati possibili:**
- `draft` - Registrazione iniziata
- `contract_pending` - In attesa di firma DocuSign
- `contract_signed` - Contratto firmato
- `pending_approval` - In attesa di approvazione admin
- `vendor_created` - Vendor WordPress/MVX creato
- `stripe_pending` - In attesa connessione Stripe
- `stripe_connected` - Stripe collegato
- `completed` - Onboarding completato
- `rejected` - Rifiutato da admin
- `expired` - Sessione scaduta

### 2. `onboarding_audit_log`
Log completo di tutte le azioni e cambiamenti di stato.

## 🔒 Row Level Security (RLS)

Le policies RLS garantiscono che:
- Gli utenti vedano solo i propri dati
- Gli admin possano vedere/modificare tutto
- I webhook system possano aggiornare i record
- I log di audit siano immutabili

## 🛠️ Funzioni Utility

### `can_proceed_to_next_step(onboarding_uuid UUID)`
Verifica se un onboarding può procedere al prossimo step.

```sql
SELECT * FROM can_proceed_to_next_step('uuid-here');
```

### `validate_session_token(token TEXT)`
Valida un session token.

```sql
SELECT * FROM validate_session_token('token-here');
```

### `email_exists(p_email TEXT)`
Verifica se un'email è già registrata.

```sql
SELECT email_exists('user@example.com');
```

### `get_incomplete_onboarding_by_email(p_email TEXT)`
Ottiene un onboarding incompleto per permettere di riprenderlo.

```sql
SELECT * FROM get_incomplete_onboarding_by_email('user@example.com');
```

### `create_audit_log(...)`
Crea un log di audit in modo sicuro.

```sql
SELECT create_audit_log(
  'onboarding-uuid',
  'contract_signed',
  'user',
  'user-id',
  '{"note": "Signed via DocuSign"}'::jsonb
);
```

## 📈 Viste Disponibili

### `active_onboardings`
Mostra tutti gli onboarding in corso (non completati).

```sql
SELECT * FROM active_onboardings;
```

### `onboarding_stats`
Statistiche aggregate sugli onboarding.

```sql
SELECT * FROM onboarding_stats;
```

### `admin_dashboard`
Vista completa per dashboard admin.

```sql
SELECT * FROM admin_dashboard ORDER BY updated_at DESC;
```

## 🧪 Testing

Per testare lo schema con dati di esempio, esegui:

```sql
-- File: 003_seed_data.sql
-- (vedi file per esempi completi)
```

## 🔐 Environment Variables

Nel tuo `.env.local` dovrai configurare:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# WordPress/MVX API
NEXT_PUBLIC_ARTPAY_SERVER_URL=https://staging-api.artpay.art

# DocuSign
DOCUSIGN_INTEGRATION_KEY=your-key
DOCUSIGN_USER_ID=your-user-id
DOCUSIGN_ACCOUNT_ID=your-account-id
DOCUSIGN_PRIVATE_KEY=your-private-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 📝 Query Comuni

### Ottenere tutti gli onboarding in attesa di approvazione

```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  business_name,
  docusign_signed_at,
  created_at
FROM vendor_onboardings
WHERE status = 'contract_signed'
ORDER BY created_at ASC;
```

### Verificare stato Stripe di un vendor

```sql
SELECT
  email,
  stripe_account_id,
  stripe_charges_enabled,
  stripe_payouts_enabled,
  stripe_connected_at
FROM vendor_onboardings
WHERE status IN ('stripe_connected', 'completed')
AND email = 'vendor@example.com';
```

### Log di audit per un onboarding specifico

```sql
SELECT
  action,
  actor_type,
  old_status,
  new_status,
  created_at,
  details
FROM onboarding_audit_log
WHERE onboarding_id = 'uuid-here'
ORDER BY created_at DESC;
```

### Statistiche di conversione per step

```sql
SELECT
  last_step_completed,
  COUNT(*) as count,
  status,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) as avg_hours
FROM vendor_onboardings
GROUP BY last_step_completed, status
ORDER BY last_step_completed, status;
```

## 🔄 Rollback

Se necessario fare rollback delle migrazioni:

```sql
-- Drop tutto (ATTENZIONE: cancella tutti i dati!)
DROP TABLE IF EXISTS onboarding_audit_log CASCADE;
DROP TABLE IF EXISTS vendor_onboardings CASCADE;
DROP VIEW IF EXISTS active_onboardings;
DROP VIEW IF EXISTS onboarding_stats;
DROP VIEW IF EXISTS admin_dashboard;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS log_status_change CASCADE;
DROP FUNCTION IF EXISTS can_proceed_to_next_step;
DROP FUNCTION IF EXISTS validate_session_token;
DROP FUNCTION IF EXISTS email_exists;
DROP FUNCTION IF EXISTS get_incomplete_onboarding_by_email;
DROP FUNCTION IF EXISTS create_audit_log;
```

## 📚 Risorse

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Artpay Backend Docs](/dox/README.md)

## 🐛 Troubleshooting

### Errore: "permission denied for table"
- Verifica che RLS sia abilitato
- Controlla che le policies siano state create correttamente
- Usa `service_role` key per operazioni backend

### Errore: "function does not exist"
- Verifica che tutte le migrazioni siano state eseguite in ordine
- Controlla che non ci siano errori di sintassi SQL

### Performance lente
- Verifica che gli indici siano stati creati
- Usa `EXPLAIN ANALYZE` per debug delle query
- Considera di aggiungere indici custom per query specifiche

## 📧 Support

Per problemi o domande:
- Email: dev@artpay.art
- GitHub Issues: [artpay-dev/vendor-onboarding](https://github.com/artpay-dev/vendor-onboarding/issues)
