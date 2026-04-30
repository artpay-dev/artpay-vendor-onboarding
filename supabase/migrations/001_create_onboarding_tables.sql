-- =====================================================
-- ARTPAY VENDOR ONBOARDING SCHEMA
-- =====================================================
-- Migrazione: 001_create_onboarding_tables
-- Descrizione: Schema completo per gestire il flusso di onboarding vendor
-- =====================================================

-- Abilita estensioni necessarie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELLA PRINCIPALE: vendor_onboardings
-- =====================================================

CREATE TABLE IF NOT EXISTS vendor_onboardings (
  -- ID primario
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- ==========================================
  -- STEP 1: Dati Essenziali
  -- ==========================================
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  terms_accepted BOOLEAN DEFAULT false NOT NULL,
  terms_accepted_at TIMESTAMPTZ,

  -- ==========================================
  -- STEP 2: DocuSign
  -- ==========================================
  docusign_envelope_id TEXT UNIQUE,
  docusign_signed_at TIMESTAMPTZ,
  docusign_recipient_email TEXT,
  contract_pdf_url TEXT,
  contract_version TEXT DEFAULT '1.0',

  -- ==========================================
  -- STEP 3: WordPress/MultivendorX
  -- ==========================================
  wp_user_id INTEGER UNIQUE,
  mvx_vendor_id INTEGER UNIQUE,
  wp_username TEXT UNIQUE,
  vendor_created_at TIMESTAMPTZ,
  consumer_key TEXT,
  consumer_secret TEXT,

  -- ==========================================
  -- STEP 4: Stripe Connect
  -- ==========================================
  stripe_account_id TEXT UNIQUE,
  stripe_connected_at TIMESTAMPTZ,
  stripe_charges_enabled BOOLEAN DEFAULT false,
  stripe_payouts_enabled BOOLEAN DEFAULT false,
  stripe_details_submitted BOOLEAN DEFAULT false,
  stripe_requirements JSONB,

  -- ==========================================
  -- Stati e Flusso
  -- ==========================================
  status TEXT NOT NULL DEFAULT 'draft',
  last_step_completed TEXT,

  -- ==========================================
  -- Admin e Approvazione
  -- ==========================================
  approved_by INTEGER,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,

  -- ==========================================
  -- Sicurezza e Sessione
  -- ==========================================
  session_token TEXT UNIQUE,
  session_expires_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verified_at TIMESTAMPTZ,

  -- ==========================================
  -- Metadata e Audit
  -- ==========================================
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),

  -- Dati aggiuntivi (JSON flessibile)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- ==========================================
  -- Constraints
  -- ==========================================
  CONSTRAINT valid_status CHECK (
    status IN (
      'draft',                  -- Appena creato
      'contract_pending',       -- In attesa firma DocuSign
      'contract_signed',        -- Firmato, in attesa approvazione
      'pending_approval',       -- Admin deve approvare
      'vendor_created',         -- Vendor MVX creato
      'stripe_pending',         -- Deve collegare Stripe
      'stripe_connected',       -- Stripe collegato
      'completed',              -- Tutto fatto, attivo
      'rejected',               -- Rifiutato da admin
      'expired'                 -- Sessione scaduta
    )
  ),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT terms_required CHECK (terms_accepted = true),
  CONSTRAINT valid_last_step CHECK (
    last_step_completed IS NULL OR
    last_step_completed IN (
      'registration',
      'contract',
      'approval',
      'vendor_creation',
      'stripe',
      'completed'
    )
  )
);

-- =====================================================
-- 2. INDICI PER PERFORMANCE
-- =====================================================

CREATE INDEX idx_onboardings_email ON vendor_onboardings(email);
CREATE INDEX idx_onboardings_status ON vendor_onboardings(status);
CREATE INDEX idx_onboardings_session ON vendor_onboardings(session_token) WHERE session_token IS NOT NULL;
CREATE INDEX idx_onboardings_stripe ON vendor_onboardings(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX idx_onboardings_wp_user ON vendor_onboardings(wp_user_id) WHERE wp_user_id IS NOT NULL;
CREATE INDEX idx_onboardings_docusign ON vendor_onboardings(docusign_envelope_id) WHERE docusign_envelope_id IS NOT NULL;
CREATE INDEX idx_onboardings_created_at ON vendor_onboardings(created_at DESC);
CREATE INDEX idx_onboardings_updated_at ON vendor_onboardings(updated_at DESC);

-- Indice per ricerca full-text
CREATE INDEX idx_onboardings_search ON vendor_onboardings USING gin(
  to_tsvector('simple',
    COALESCE(email, '') || ' ' ||
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(business_name, '')
  )
);

-- =====================================================
-- 3. TABELLA AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  onboarding_id UUID NOT NULL REFERENCES vendor_onboardings(id) ON DELETE CASCADE,

  -- Cambio di stato
  old_status TEXT,
  new_status TEXT,

  -- Azione
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL, -- 'user', 'admin', 'system', 'webhook'
  actor_id TEXT,

  -- Dettagli
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- IP e User Agent (per sicurezza)
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT valid_action CHECK (
    action IN (
      'created',
      'status_changed',
      'contract_sent',
      'contract_signed',
      'approved',
      'rejected',
      'vendor_created',
      'stripe_connected',
      'completed',
      'email_sent',
      'session_renewed',
      'error'
    )
  ),
  CONSTRAINT valid_actor_type CHECK (
    actor_type IN ('user', 'admin', 'system', 'webhook')
  )
);

CREATE INDEX idx_audit_onboarding ON onboarding_audit_log(onboarding_id, created_at DESC);
CREATE INDEX idx_audit_action ON onboarding_audit_log(action);
CREATE INDEX idx_audit_created_at ON onboarding_audit_log(created_at DESC);

-- =====================================================
-- 4. FUNZIONI HELPER
-- =====================================================

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_activity_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_timestamp
  BEFORE UPDATE ON vendor_onboardings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funzione per creare log automatico su cambio stato
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO onboarding_audit_log (
      onboarding_id,
      old_status,
      new_status,
      action,
      actor_type,
      details
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'status_changed',
      'system',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_status_change
  AFTER UPDATE ON vendor_onboardings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_status_change();

-- =====================================================
-- 5. VISTE UTILITY
-- =====================================================

-- Vista per onboarding in corso (non completati)
CREATE OR REPLACE VIEW active_onboardings AS
SELECT
  id,
  email,
  first_name,
  last_name,
  business_name,
  status,
  last_step_completed,
  created_at,
  updated_at,
  last_activity_at,
  EXTRACT(EPOCH FROM (NOW() - last_activity_at)) / 3600 AS hours_inactive
FROM vendor_onboardings
WHERE status NOT IN ('completed', 'rejected', 'expired')
ORDER BY updated_at DESC;

-- Vista per statistiche onboarding
CREATE OR REPLACE VIEW onboarding_stats AS
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) as avg_hours_to_complete
FROM vendor_onboardings
GROUP BY status;

-- Vista per dashboard admin
CREATE OR REPLACE VIEW admin_dashboard AS
SELECT
  o.id,
  o.email,
  o.first_name,
  o.last_name,
  o.business_name,
  o.status,
  o.created_at,
  o.updated_at,
  o.docusign_signed_at,
  o.vendor_created_at,
  o.stripe_connected_at,
  o.completed_at,
  COUNT(DISTINCT al.id) as audit_log_count,
  MAX(al.created_at) as last_audit_entry
FROM vendor_onboardings o
LEFT JOIN onboarding_audit_log al ON al.onboarding_id = o.id
GROUP BY o.id
ORDER BY o.updated_at DESC;

-- =====================================================
-- 6. FUNZIONI DI BUSINESS LOGIC
-- =====================================================

-- Genera session token sicuro
CREATE OR REPLACE FUNCTION generate_session_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Verifica se un onboarding può procedere al prossimo step
CREATE OR REPLACE FUNCTION can_proceed_to_next_step(onboarding_uuid UUID)
RETURNS TABLE(
  can_proceed BOOLEAN,
  next_step TEXT,
  reason TEXT
) AS $$
DECLARE
  current_status TEXT;
  current_onboarding RECORD;
BEGIN
  SELECT * INTO current_onboarding
  FROM vendor_onboardings
  WHERE id = onboarding_uuid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, 'Onboarding not found';
    RETURN;
  END IF;

  current_status := current_onboarding.status;

  CASE current_status
    WHEN 'draft' THEN
      RETURN QUERY SELECT true, 'contract', 'Ready to sign contract';

    WHEN 'contract_pending' THEN
      RETURN QUERY SELECT false, 'contract', 'Waiting for contract signature';

    WHEN 'contract_signed' THEN
      RETURN QUERY SELECT false, 'approval', 'Waiting for admin approval';

    WHEN 'pending_approval' THEN
      RETURN QUERY SELECT false, 'approval', 'Waiting for admin approval';

    WHEN 'vendor_created' THEN
      RETURN QUERY SELECT true, 'stripe', 'Ready to connect Stripe';

    WHEN 'stripe_pending' THEN
      RETURN QUERY SELECT false, 'stripe', 'Waiting for Stripe connection';

    WHEN 'stripe_connected' THEN
      IF current_onboarding.stripe_charges_enabled AND current_onboarding.stripe_payouts_enabled THEN
        RETURN QUERY SELECT true, 'completed', 'Ready to complete';
      ELSE
        RETURN QUERY SELECT false, 'stripe', 'Stripe account not fully configured';
      END IF;

    WHEN 'completed' THEN
      RETURN QUERY SELECT false, NULL::TEXT, 'Onboarding already completed';

    WHEN 'rejected' THEN
      RETURN QUERY SELECT false, NULL::TEXT, 'Onboarding rejected';

    WHEN 'expired' THEN
      RETURN QUERY SELECT false, NULL::TEXT, 'Onboarding expired';

    ELSE
      RETURN QUERY SELECT false, NULL::TEXT, 'Unknown status';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. COMMENTI DOCUMENTAZIONE
-- =====================================================

COMMENT ON TABLE vendor_onboardings IS 'Tabella principale per tracciare il processo di onboarding dei vendor';
COMMENT ON COLUMN vendor_onboardings.status IS 'Stato corrente del processo di onboarding';
COMMENT ON COLUMN vendor_onboardings.session_token IS 'Token per riprendere la sessione di onboarding';
COMMENT ON COLUMN vendor_onboardings.metadata IS 'JSON flessibile per dati aggiuntivi futuri';

COMMENT ON TABLE onboarding_audit_log IS 'Log completo di tutte le azioni e cambi di stato durante l onboarding';

COMMENT ON FUNCTION can_proceed_to_next_step IS 'Verifica se un onboarding può procedere al prossimo step e ritorna il motivo';
