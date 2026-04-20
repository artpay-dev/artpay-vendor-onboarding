-- =====================================================
-- ARTPAY VENDOR ONBOARDING - RLS POLICIES
-- =====================================================
-- Migrazione: 002_add_rls_policies
-- Descrizione: Row Level Security per proteggere i dati degli onboarding
-- =====================================================

-- =====================================================
-- 1. ABILITA RLS SULLE TABELLE
-- =====================================================

ALTER TABLE vendor_onboardings ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_audit_log ENABLE ROW LEVEL SECURITY;

-- Abilita RLS anche sulle views
ALTER VIEW active_onboardings SET (security_barrier = true);
ALTER VIEW onboarding_stats SET (security_barrier = true);
ALTER VIEW admin_dashboard SET (security_barrier = true);

-- =====================================================
-- 2. POLICIES PER vendor_onboardings
-- =====================================================

-- Policy: Gli utenti possono vedere solo il proprio onboarding
CREATE POLICY "Users can view their own onboarding"
  ON vendor_onboardings
  FOR SELECT
  USING (
    -- Se hanno un session_token valido
    session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    OR
    -- Se sono autenticati e l'email corrisponde
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Policy: Gli utenti possono creare il proprio onboarding
CREATE POLICY "Users can create their own onboarding"
  ON vendor_onboardings
  FOR INSERT
  WITH CHECK (true); -- Chiunque può iniziare un onboarding

-- Policy: Gli utenti possono aggiornare solo il proprio onboarding
CREATE POLICY "Users can update their own onboarding"
  ON vendor_onboardings
  FOR UPDATE
  USING (
    session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
    OR
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Policy: Gli admin possono vedere tutti gli onboarding
CREATE POLICY "Admins can view all onboardings"
  ON vendor_onboardings
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- Policy: Gli admin possono aggiornare qualsiasi onboarding
CREATE POLICY "Admins can update all onboardings"
  ON vendor_onboardings
  FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- Policy: I webhook system possono aggiornare onboarding
CREATE POLICY "System webhooks can update onboardings"
  ON vendor_onboardings
  FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
  );

-- =====================================================
-- 3. POLICIES PER onboarding_audit_log
-- =====================================================

-- Policy: Gli utenti possono vedere solo i log del proprio onboarding
CREATE POLICY "Users can view their own audit logs"
  ON onboarding_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM vendor_onboardings o
      WHERE o.id = onboarding_audit_log.onboarding_id
      AND (
        o.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
        OR
        o.email = current_setting('request.jwt.claims', true)::json->>'email'
      )
    )
  );

-- Policy: Solo il system può inserire log
CREATE POLICY "System can insert audit logs"
  ON onboarding_audit_log
  FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'role' IN ('service_role', 'admin')
  );

-- Policy: Gli admin possono vedere tutti i log
CREATE POLICY "Admins can view all audit logs"
  ON onboarding_audit_log
  FOR SELECT
  USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin'
  );

-- Policy: Nessuno può modificare i log (immutabili)
-- Non serve policy DELETE/UPDATE perché RLS le blocca di default

-- =====================================================
-- 4. FUNZIONE PER VALIDARE SESSION TOKEN
-- =====================================================

CREATE OR REPLACE FUNCTION validate_session_token(token TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  onboarding_id UUID,
  email TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (o.session_expires_at IS NULL OR o.session_expires_at > NOW()) as is_valid,
    o.id,
    o.email,
    o.status
  FROM vendor_onboardings o
  WHERE o.session_token = token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. FUNZIONE PER CREARE AUDIT LOG (sicura)
-- =====================================================

CREATE OR REPLACE FUNCTION create_audit_log(
  p_onboarding_id UUID,
  p_action TEXT,
  p_actor_type TEXT DEFAULT 'system',
  p_actor_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_old_status TEXT DEFAULT NULL,
  p_new_status TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO onboarding_audit_log (
    onboarding_id,
    old_status,
    new_status,
    action,
    actor_type,
    actor_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_onboarding_id,
    p_old_status,
    p_new_status,
    p_action,
    p_actor_type,
    p_actor_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

-- Revoca tutti i permessi di default
REVOKE ALL ON vendor_onboardings FROM PUBLIC;
REVOKE ALL ON onboarding_audit_log FROM PUBLIC;

-- Revoca permessi sulle views (solo admin/service_role)
REVOKE ALL ON active_onboardings FROM PUBLIC;
REVOKE ALL ON onboarding_stats FROM PUBLIC;
REVOKE ALL ON admin_dashboard FROM PUBLIC;

-- Permessi per authenticated users (tramite RLS)
GRANT SELECT, INSERT, UPDATE ON vendor_onboardings TO authenticated;
GRANT SELECT ON onboarding_audit_log TO authenticated;

-- Permessi per service_role (API backend) - accesso completo
GRANT ALL ON vendor_onboardings TO service_role;
GRANT ALL ON onboarding_audit_log TO service_role;
GRANT SELECT ON active_onboardings TO service_role;
GRANT SELECT ON onboarding_stats TO service_role;
GRANT SELECT ON admin_dashboard TO service_role;

-- Permessi per anon (solo lettura pubblica se necessario)
-- GRANT SELECT ON vendor_onboardings TO anon; -- Commentato per sicurezza

-- Le views dashboard/stats sono accessibili SOLO tramite service_role
-- Questo significa solo le API backend possono accedervi (non direct client queries)

-- =====================================================
-- 7. FUNZIONI HELPER PER API
-- =====================================================

-- Funzione per verificare se un email esiste già
CREATE OR REPLACE FUNCTION email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM vendor_onboardings
    WHERE LOWER(email) = LOWER(p_email)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione per ottenere onboarding incompleto per email
CREATE OR REPLACE FUNCTION get_incomplete_onboarding_by_email(p_email TEXT)
RETURNS TABLE(
  id UUID,
  status TEXT,
  last_step_completed TEXT,
  created_at TIMESTAMPTZ,
  session_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.status,
    o.last_step_completed,
    o.created_at,
    o.session_token
  FROM vendor_onboardings o
  WHERE LOWER(o.email) = LOWER(p_email)
    AND o.status NOT IN ('completed', 'rejected')
  ORDER BY o.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funzione sicura per ottenere statistiche dashboard (solo per admin API)
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE(
  total_onboardings BIGINT,
  completed_onboardings BIGINT,
  pending_approval BIGINT,
  in_progress BIGINT,
  rejected_onboardings BIGINT,
  avg_completion_days NUMERIC
) AS $$
BEGIN
  -- Questa funzione è chiamata solo da API backend con service_role
  -- Non verifica ruoli perché la security è gestita a livello API
  RETURN QUERY
  SELECT * FROM onboarding_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. TRIGGER PER VALIDARE STATUS TRANSITIONS
-- =====================================================

-- Funzione trigger per validare le transizioni di status
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Se lo status non cambia, ok
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Valida transizioni permesse
  IF (OLD.status = 'draft' AND NEW.status IN ('contract_pending', 'rejected', 'expired')) OR
     (OLD.status = 'contract_pending' AND NEW.status IN ('contract_signed', 'expired', 'rejected')) OR
     (OLD.status = 'contract_signed' AND NEW.status IN ('pending_approval', 'rejected')) OR
     (OLD.status = 'pending_approval' AND NEW.status IN ('vendor_created', 'rejected')) OR
     (OLD.status = 'vendor_created' AND NEW.status IN ('stripe_pending', 'rejected')) OR
     (OLD.status = 'stripe_pending' AND NEW.status IN ('stripe_connected', 'rejected')) OR
     (OLD.status = 'stripe_connected' AND NEW.status = 'completed') THEN
    RETURN NEW;
  END IF;

  -- Se arriviamo qui, la transizione non è valida
  RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- Applica il trigger
CREATE TRIGGER validate_status_transition_trigger
  BEFORE UPDATE ON vendor_onboardings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION validate_status_transition();

-- =====================================================
-- 9. COMMENTI
-- =====================================================

COMMENT ON FUNCTION validate_session_token IS 'Valida un session token e ritorna le info dell onboarding';
COMMENT ON FUNCTION create_audit_log IS 'Crea un log di audit in modo sicuro (SECURITY DEFINER)';
COMMENT ON FUNCTION email_exists IS 'Verifica se un email è già registrata';
COMMENT ON FUNCTION get_incomplete_onboarding_by_email IS 'Ottiene un onboarding incompleto per riprendere il flusso';
COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Ottiene statistiche dashboard (solo per backend API con service_role)';
COMMENT ON FUNCTION validate_status_transition IS 'Trigger function per validare le transizioni di status permesse';
