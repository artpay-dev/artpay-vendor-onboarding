-- Aggiunge la transizione draft → pending_approval per il flusso no-contract (senza DocuSign)
CREATE OR REPLACE FUNCTION validate_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF (OLD.status = 'draft' AND NEW.status IN ('contract_pending', 'pending_approval', 'rejected', 'expired')) OR
     (OLD.status = 'contract_pending' AND NEW.status IN ('contract_signed', 'expired', 'rejected')) OR
     (OLD.status = 'contract_signed' AND NEW.status IN ('pending_approval', 'rejected')) OR
     (OLD.status = 'pending_approval' AND NEW.status IN ('vendor_created', 'rejected')) OR
     (OLD.status = 'vendor_created' AND NEW.status IN ('stripe_pending', 'rejected')) OR
     (OLD.status = 'stripe_pending' AND NEW.status IN ('stripe_connected', 'rejected')) OR
     (OLD.status = 'stripe_connected' AND NEW.status = 'completed') THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid status transition from % to %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;