-- =====================================================
-- ARTPAY VENDOR ONBOARDING - SEED DATA
-- =====================================================
-- Migrazione: 003_seed_data
-- Descrizione: Dati di test per sviluppo e testing
-- ATTENZIONE: Non eseguire in produzione!
-- =====================================================

-- Solo per ambiente di sviluppo/staging
DO $$
BEGIN
  -- Verifica che non siamo in produzione
  IF current_database() = 'production' THEN
    RAISE EXCEPTION 'SEED DATA NON PUO ESSERE ESEGUITO IN PRODUZIONE!';
  END IF;
END $$;

-- =====================================================
-- 1. DATI DI TEST - ONBOARDING COMPLETO
-- =====================================================

-- Vendor completato con successo
INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  terms_accepted_at,

  -- DocuSign
  docusign_envelope_id,
  docusign_signed_at,
  contract_pdf_url,

  -- WordPress
  wp_user_id,
  mvx_vendor_id,
  wp_username,
  vendor_created_at,
  consumer_key,
  consumer_secret,

  -- Stripe
  stripe_account_id,
  stripe_connected_at,
  stripe_charges_enabled,
  stripe_payouts_enabled,
  stripe_details_submitted,

  -- Status
  status,
  last_step_completed,

  -- Metadata
  completed_at,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'vendor.complete@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- password: test123
  'Mario',
  'Rossi',
  'Galleria d''Arte Moderna',
  true,
  NOW() - INTERVAL '7 days',

  -- DocuSign
  'ENV-TEST-COMPLETE-001',
  NOW() - INTERVAL '6 days',
  'https://docusign.com/contracts/test-complete.pdf',

  -- WordPress
  101,
  201,
  'galleria-arte-moderna',
  NOW() - INTERVAL '5 days',
  'ck_test_complete_key',
  'cs_test_complete_secret',

  -- Stripe
  'acct_test_complete',
  NOW() - INTERVAL '3 days',
  true,
  true,
  true,

  -- Status
  'completed',
  'completed',

  -- Metadata
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '2 days'
);

-- =====================================================
-- 2. VENDOR IN ATTESA DI STRIPE
-- =====================================================

INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  terms_accepted_at,
  docusign_envelope_id,
  docusign_signed_at,
  wp_user_id,
  mvx_vendor_id,
  wp_username,
  vendor_created_at,
  status,
  last_step_completed,
  created_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'vendor.stripe-pending@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Laura',
  'Bianchi',
  'Arte Contemporanea',
  true,
  NOW() - INTERVAL '3 days',
  'ENV-TEST-STRIPE-PENDING',
  NOW() - INTERVAL '2 days',
  102,
  202,
  'arte-contemporanea',
  NOW() - INTERVAL '1 day',
  'vendor_created',
  'vendor_creation',
  NOW() - INTERVAL '3 days'
);

-- =====================================================
-- 3. VENDOR IN ATTESA DI APPROVAZIONE
-- =====================================================

INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  terms_accepted_at,
  docusign_envelope_id,
  docusign_signed_at,
  contract_pdf_url,
  status,
  last_step_completed,
  created_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'vendor.pending-approval@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Giuseppe',
  'Verdi',
  'Galleria Impressionista',
  true,
  NOW() - INTERVAL '2 days',
  'ENV-TEST-PENDING-APPROVAL',
  NOW() - INTERVAL '1 day',
  'https://docusign.com/contracts/test-pending.pdf',
  'contract_signed',
  'contract',
  NOW() - INTERVAL '2 days'
);

-- =====================================================
-- 4. VENDOR IN ATTESA DI FIRMA CONTRATTO
-- =====================================================

INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  terms_accepted_at,
  docusign_envelope_id,
  status,
  last_step_completed,
  session_token,
  session_expires_at,
  created_at
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'vendor.contract-pending@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Anna',
  'Neri',
  'Arte Classica',
  true,
  NOW() - INTERVAL '1 day',
  'ENV-TEST-CONTRACT-PENDING',
  'contract_pending',
  'registration',
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '7 days',
  NOW() - INTERVAL '1 day'
);

-- =====================================================
-- 5. VENDOR APPENA REGISTRATO (DRAFT)
-- =====================================================

INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  terms_accepted_at,
  status,
  last_step_completed,
  session_token,
  session_expires_at,
  created_at
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  'vendor.draft@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Paolo',
  'Gialli',
  'Galleria Moderna',
  true,
  NOW() - INTERVAL '2 hours',
  'draft',
  'registration',
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '7 days',
  NOW() - INTERVAL '2 hours'
);

-- =====================================================
-- 6. VENDOR RIFIUTATO
-- =====================================================

INSERT INTO vendor_onboardings (
  id,
  email,
  password_hash,
  first_name,
  last_name,
  business_name,
  terms_accepted,
  docusign_envelope_id,
  docusign_signed_at,
  status,
  rejected_at,
  rejection_reason,
  admin_notes,
  created_at
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  'vendor.rejected@test.com',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Luca',
  'Viola',
  'Arte Discutibile',
  true,
  'ENV-TEST-REJECTED',
  NOW() - INTERVAL '3 days',
  'rejected',
  NOW() - INTERVAL '1 day',
  'Documentazione incompleta',
  'Richiesta documentazione aggiuntiva non fornita',
  NOW() - INTERVAL '4 days'
);

-- =====================================================
-- 7. AUDIT LOG PER I TEST
-- =====================================================

-- Log per vendor completato
INSERT INTO onboarding_audit_log (onboarding_id, action, actor_type, old_status, new_status, details, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'created', 'user', NULL, 'draft', '{"step": "registration"}'::jsonb, NOW() - INTERVAL '7 days'),
  ('11111111-1111-1111-1111-111111111111', 'status_changed', 'system', 'draft', 'contract_pending', '{"step": "contract_sent"}'::jsonb, NOW() - INTERVAL '6 days 12 hours'),
  ('11111111-1111-1111-1111-111111111111', 'contract_signed', 'user', 'contract_pending', 'contract_signed', '{"envelope_id": "ENV-TEST-COMPLETE-001"}'::jsonb, NOW() - INTERVAL '6 days'),
  ('11111111-1111-1111-1111-111111111111', 'approved', 'admin', 'contract_signed', 'vendor_created', '{"admin_id": "admin-001"}'::jsonb, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'vendor_created', 'system', 'vendor_created', 'vendor_created', '{"wp_user_id": 101, "mvx_vendor_id": 201}'::jsonb, NOW() - INTERVAL '5 days'),
  ('11111111-1111-1111-1111-111111111111', 'stripe_connected', 'webhook', 'vendor_created', 'stripe_connected', '{"account_id": "acct_test_complete"}'::jsonb, NOW() - INTERVAL '3 days'),
  ('11111111-1111-1111-1111-111111111111', 'completed', 'system', 'stripe_connected', 'completed', '{"all_steps_completed": true}'::jsonb, NOW() - INTERVAL '2 days');

-- Log per vendor in attesa di approvazione
INSERT INTO onboarding_audit_log (onboarding_id, action, actor_type, old_status, new_status, details, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'created', 'user', NULL, 'draft', '{"step": "registration"}'::jsonb, NOW() - INTERVAL '2 days'),
  ('33333333-3333-3333-3333-333333333333', 'contract_signed', 'user', 'draft', 'contract_signed', '{"envelope_id": "ENV-TEST-PENDING-APPROVAL"}'::jsonb, NOW() - INTERVAL '1 day');

-- Log per vendor rifiutato
INSERT INTO onboarding_audit_log (onboarding_id, action, actor_type, old_status, new_status, details, created_at)
VALUES
  ('66666666-6666-6666-6666-666666666666', 'created', 'user', NULL, 'draft', '{"step": "registration"}'::jsonb, NOW() - INTERVAL '4 days'),
  ('66666666-6666-6666-6666-666666666666', 'contract_signed', 'user', 'draft', 'contract_signed', '{"envelope_id": "ENV-TEST-REJECTED"}'::jsonb, NOW() - INTERVAL '3 days'),
  ('66666666-6666-6666-6666-666666666666', 'rejected', 'admin', 'contract_signed', 'rejected', '{"reason": "Documentazione incompleta", "admin_id": "admin-001"}'::jsonb, NOW() - INTERVAL '1 day');

-- =====================================================
-- 8. VERIFICA DATI INSERITI
-- =====================================================

DO $$
DECLARE
  total_count INTEGER;
  draft_count INTEGER;
  completed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM vendor_onboardings;
  SELECT COUNT(*) INTO draft_count FROM vendor_onboardings WHERE status = 'draft';
  SELECT COUNT(*) INTO completed_count FROM vendor_onboardings WHERE status = 'completed';

  RAISE NOTICE 'Seed data inseriti con successo:';
  RAISE NOTICE '  - Totale onboarding: %', total_count;
  RAISE NOTICE '  - Draft: %', draft_count;
  RAISE NOTICE '  - Completati: %', completed_count;
END $$;

-- =====================================================
-- 9. QUERY DI VERIFICA
-- =====================================================

-- Mostra tutti gli onboarding inseriti
SELECT
  email,
  status,
  first_name,
  last_name,
  business_name,
  created_at
FROM vendor_onboardings
ORDER BY created_at DESC;

-- Mostra statistiche
SELECT * FROM onboarding_stats;

-- Mostra onboarding attivi
SELECT * FROM active_onboardings;
