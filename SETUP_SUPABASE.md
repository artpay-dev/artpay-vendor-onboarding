# 🚀 Setup Supabase - Guida Rapida

## 1️⃣ Crea Progetto Supabase

1. Vai su [https://app.supabase.com](https://app.supabase.com)
2. Crea un nuovo progetto o seleziona uno esistente
3. Prendi nota di:
   - **Project URL**: `https://xxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

📍 Trovi le keys in: **Project Settings → API**

---

## 2️⃣ Applica le Migrazioni

### Opzione A: Dashboard Supabase (Più Veloce)

1. Vai su **SQL Editor** nel menu laterale
2. Clicca su **+ New query**
3. Copia e incolla il contenuto di questi file in ordine:

#### Step 1: Schema Principale
```sql
-- Copia e incolla tutto da:
supabase/migrations/001_create_onboarding_tables.sql
```
Clicca **Run** e attendi conferma ✅

#### Step 2: Row Level Security
```sql
-- Copia e incolla tutto da:
supabase/migrations/002_add_rls_policies.sql
```
Clicca **Run** e attendi conferma ✅

#### Step 3: Dati di Test (Opzionale)
```sql
-- Copia e incolla tutto da:
supabase/migrations/003_seed_data.sql
```
Clicca **Run** e attendi conferma ✅

### Opzione B: Supabase CLI

```bash
# Installa CLI
npm install -g supabase

# Login
supabase login

# Link al progetto
supabase link --project-ref your-project-ref

# Applica migrazioni
supabase db push
```

---

## 3️⃣ Configura Environment Variables

Copia `.env.example` in `.env.local` e compila:

```bash
cp .env.example .env.local
```

Modifica `.env.local`:

```env
# Supabase (OBBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# WordPress (esistente)
NEXT_PUBLIC_ARTPAY_SERVER_URL=https://staging-api.artpay.art

# Il resto sarà configurato dopo
```

---

## 4️⃣ Verifica Setup

Testa che tutto funzioni:

```bash
# Build del progetto
npm run build

# Se non ci sono errori, tutto ok! ✅
```

### Test API

Puoi testare la prima API:

```bash
curl -X POST http://localhost:3000/api/onboarding/start \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "first_name": "Mario",
    "last_name": "Rossi",
    "business_name": "Galleria Test",
    "terms_accepted": true
  }'
```

Dovresti ricevere una response tipo:

```json
{
  "success": true,
  "data": {
    "onboarding_id": "uuid...",
    "session_token": "token...",
    "status": "draft",
    "next_step": "contract",
    "next_url": "/onboarding/contract"
  }
}
```

---

## 5️⃣ Verifica Database

Vai su Supabase Dashboard → **Table Editor**

Dovresti vedere:

- ✅ `vendor_onboardings` (tabella principale)
- ✅ `onboarding_audit_log` (log)

Clicca su `vendor_onboardings` e verifica che sia vuota (o con dati di test se hai eseguito seed).

---

## 🎯 Prossimi Step

Ora sei pronto per:

1. ✅ **Refactor del form multi-step** (usa nuove API)
2. ✅ **Integrazione DocuSign** (Step 2)
3. ✅ **Admin dashboard** (approva vendor)
4. ✅ **Stripe Connect** (Step 4)

---

## 🐛 Troubleshooting

### Errore: "Missing env.NEXT_PUBLIC_SUPABASE_URL"
- Verifica che `.env.local` esista
- Riavvia il dev server: `npm run dev`

### Errore: "relation vendor_onboardings does not exist"
- Le migrazioni non sono state applicate
- Torna al **Step 2** e applica gli SQL

### Errore: "permission denied for table"
- Le policies RLS non sono attive
- Verifica di aver eseguito `002_add_rls_policies.sql`

### Errore: "function email_exists does not exist"
- Alcune funzioni non sono state create
- Ri-esegui `001_create_onboarding_tables.sql`

---

## 📚 Risorse Utili

- [Supabase Docs](https://supabase.com/docs)
- [Schema SQL](./supabase/README.md)
- [API Types](./src/types/supabase.ts)

---

## ✅ Checklist Completa

Prima di continuare, verifica:

- [ ] Progetto Supabase creato
- [ ] Migrazioni SQL applicate (001, 002, 003)
- [ ] Tabelle visibili in Table Editor
- [ ] `.env.local` configurato con Supabase keys
- [ ] `npm run build` completa senza errori
- [ ] Test API `/api/onboarding/start` funziona

Se tutti i check sono ✅ sei pronto! 🎉
