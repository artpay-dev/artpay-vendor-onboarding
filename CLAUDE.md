# vendor-onboarding — CLAUDE.md

Next.js 15 (App Router) + Supabase + DocuSign + Stripe Connect + WordPress/MultivendorX.
Onboarding flow per vendor artpay: registrazione → contratto DocuSign → vendor WP → Stripe Connect.

## Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind, shadcn/ui, React Hook Form + Zod
- **Backend**: API Routes in `/src/app/api/`
- **DB**: Supabase (Postgres) via `supabaseAdmin` con service role key — bypassa RLS
- **Auth**: session token custom (cookie `session_token` + `sessionStorage["onboarding_id"]`)
- **DocuSign**: embedded signing, webhook su `/api/webhooks/docusign`
- **Stripe**: Stripe Connect (account connessi), Account Link flow
- **WordPress**: MultivendorX REST API (`/wp-json/mvx/v1/vendors`)

## Struttura chiave

```
src/
  app/
    api/
      onboarding/
        start/route.ts          # POST: registrazione, crea onboarding in Supabase
        resume/route.ts         # GET+POST: riprende onboarding per email
        [id]/
          contract/route.ts     # POST: genera link DocuSign
          contract/sync/route.ts # POST: fallback polling DocuSign (usato da pending-approval)
          status/route.ts       # GET: polling status onboarding
          sso/route.ts          # POST: SSO token per login WordPress
      webhooks/
        docusign/route.ts       # POST: webhook DocuSign → crea vendor WP
      stripe/
        connect/url/route.ts    # POST: genera Account Link Stripe
        connect/return/route.ts # GET: callback Stripe → completa onboarding
    onboarding/
      contract/page.tsx         # Step 2: avvia firma DocuSign
      pending-approval/page.tsx # Step 3: polling + sync dopo firma
      stripe-connect/page.tsx   # Step 4: connette Stripe
      completed/page.tsx        # Step 5: completamento
    riprendi/page.tsx           # Pagina "riprendi" via email (salva per dopo)
  lib/
    wordpress.ts                # createWordPressVendor, updateVendorStripeAccount
    docusign.ts                 # createVendorContractEnvelope, getEmbeddedSigningUrl, getEnvelopeStatus
    stripe-connect.ts           # createConnectedAccount, createAccountLink, getAccountStatus
    supabase/server.ts          # supabaseAdmin (service role)
    api-utils.ts                # validate session, getNextStepFromStatus, normalizeEmail
  components/
    registration/
      basic-onboarding-form.tsx # Form registrazione (Step 1)
supabase/
  migrations/
    002_add_rls_policies.sql    # RLS, validate_session_token, get_incomplete_onboarding_by_email
```

## Flusso onboarding (stati Supabase)

```
draft → contract_pending → contract_signed → vendor_created → stripe_pending → completed
                                                                └─ stripe_connected (intermedio)
rejected / expired (terminali)
```

- `draft`: registrazione completata, contratto non ancora avviato
- `contract_pending`: link DocuSign generato, attesa firma
- `contract_signed`: contratto firmato, vendor WP in creazione
- `vendor_created`: vendor WP creato, attesa Stripe
- `completed`: Stripe connesso, tutto ok

## Vendor WP creation — dove succede

La chiamata `createWordPressVendor` avviene in DUE posti:
1. **`/api/webhooks/docusign/route.ts`**: webhook da DocuSign (evento `status=completed`)
2. **`/api/onboarding/[id]/contract/sync/route.ts`**: chiamato da `pending-approval` dopo redirect DocuSign

Entrambi leggono `onboarding.email` da Supabase con `select('*')`.
Il sync è il path principale nel browser; il webhook è il fallback asincrono.

Guard obbligatorie prima di `createWordPressVendor`:
```ts
if (!onboarding.email) throw new Error('Email missing...');
if (!onboarding.temp_password) throw new Error('Temp password not found...');
```

## Sessione custom

- Cookie `session_token` (7gg, samesite=strict)
- `sessionStorage["onboarding_id"]`
- DB: `session_expires_at` — validato da `validate_session_token` RPC
- **IMPORTANTE**: il resume (`POST /api/onboarding/resume`) rinnova `session_expires_at` nel DB

## "Salva per dopo" flow

1. Utente clicca "Salva per dopo" → `router.push("/riprendi")`
2. `/riprendi`: inserisce email → `POST /api/onboarding/resume`
3. Resume API: trova l'onboarding, **rinnova `session_expires_at`**, ritorna `session_token` + `onboarding_id`
4. Client setta cookie e sessionStorage, redirect a `resume_url`

Bug noti risolti:
- Il resume non aggiornava `session_expires_at` → il sync falliva silenziosamente con 401
- Il sync non gestiva il recovery da `contract_signed` + `wp_user_id=null`
- Il frontend non controllava il response del sync (401 passava silenzioso)

## Supabase RPC rilevanti

- `validate_session_token(token)` → `{ is_valid, onboarding_id, email, status }`
- `get_incomplete_onboarding_by_email(p_email)` → `{ id, status, last_step_completed, created_at, session_token }` (NON ritorna email)
- `create_audit_log(...)` → log azioni
- `can_proceed_to_next_step(onboarding_uuid)` → bool

## Env vars necessarie

```
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_ARTPAY_SERVER_URL     # WordPress base URL
NEXT_PUBLIC_APP_URL               # URL di questo app
DOCUSIGN_ACCOUNT_ID
DOCUSIGN_INTEGRATION_KEY
DOCUSIGN_USER_ID
DOCUSIGN_PRIVATE_KEY_PATH
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_DASHBOARD_URL         # Dashboard WordPress vendor
```

## Note importanti

- `supabaseAdmin` usa service role → bypassa RLS, usarlo SOLO nel backend
- `temp_password` è la password in chiaro usata per creare il vendor WP. Viene nullata dopo la creazione e copiata in `metadata.wp_password` per SSO
- Il webhook DocuSign NON valida session token (è un sistema esterno) — trova l'onboarding per `docusign_envelope_id`
- Il return Stripe (`/api/stripe/connect/return`) NON valida session token — usa `onboarding_id` dall'URL
- `getNextStepFromStatus` mappa status → URL prossimo step (in `api-utils.ts`)