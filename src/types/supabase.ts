/**
 * Supabase Database Types
 * Generato dallo schema: supabase/migrations/001_create_onboarding_tables.sql
 */

export type OnboardingStatus =
  | 'draft'
  | 'contract_pending'
  | 'contract_signed'
  | 'pending_approval'
  | 'vendor_created'
  | 'stripe_pending'
  | 'stripe_connected'
  | 'completed'
  | 'rejected'
  | 'expired';

export type OnboardingStep =
  | 'registration'
  | 'contract'
  | 'approval'
  | 'vendor_creation'
  | 'stripe'
  | 'completed';

export type AuditLogAction =
  | 'created'
  | 'status_changed'
  | 'contract_sent'
  | 'contract_signed'
  | 'approved'
  | 'rejected'
  | 'vendor_created'
  | 'stripe_connected'
  | 'completed'
  | 'email_sent'
  | 'session_renewed'
  | 'error';

export type ActorType = 'user' | 'admin' | 'system' | 'webhook';

export interface VendorOnboarding {
  // ID
  id: string;

  // Step 1: Dati Essenziali
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  business_name: string;
  terms_accepted: boolean;
  terms_accepted_at: string | null;

  // Step 2: DocuSign
  docusign_envelope_id: string | null;
  docusign_signed_at: string | null;
  docusign_recipient_email: string | null;
  contract_pdf_url: string | null;
  contract_version: string;

  // Step 3: WordPress/MVX
  wp_user_id: number | null;
  mvx_vendor_id: number | null;
  wp_username: string | null;
  vendor_created_at: string | null;
  consumer_key: string | null;
  consumer_secret: string | null;

  // Step 4: Stripe
  stripe_account_id: string | null;
  stripe_connected_at: string | null;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  stripe_details_submitted: boolean;
  stripe_requirements: Record<string, unknown> | null;

  // Stati
  status: OnboardingStatus;
  last_step_completed: OnboardingStep | null;

  // Admin
  approved_by: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;

  // Sicurezza
  session_token: string | null;
  session_expires_at: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verified_at: string | null;

  // Metadata
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  last_activity_at: string;
  metadata: Record<string, unknown>;
}

export interface OnboardingAuditLog {
  id: string;
  onboarding_id: string;
  old_status: OnboardingStatus | null;
  new_status: OnboardingStatus | null;
  action: AuditLogAction;
  actor_type: ActorType;
  actor_id: string | null;
  details: Record<string, unknown>;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface StartOnboardingRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name: string;
  ragione_sociale: string;
  partita_iva: string;
  indirizzo: string;
  iban: string;
  terms_accepted: boolean;
}

export interface StartOnboardingResponse {
  onboarding_id: string;
  session_token: string;
  status: OnboardingStatus;
  next_step: OnboardingStep;
  next_url: string;
}

export interface GetOnboardingStatusResponse {
  onboarding_id: string;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  can_proceed: boolean;
  next_url: string | null;
  completed_steps: OnboardingStep[];
  pending_steps: OnboardingStep[];
  data?: Partial<VendorOnboarding>;
}

export interface GetContractLinkResponse {
  docusign_url: string;
  envelope_id: string;
}

export interface ApproveVendorRequest {
  onboarding_id: string;
  admin_notes?: string;
}

export interface ApproveVendorResponse {
  success: boolean;
  wp_user_id: number;
  mvx_vendor_id: number;
  consumer_key: string;
  consumer_secret: string;
}

export interface GetStripeConnectLinkResponse {
  url: string;
  account_id: string;
}

export interface ResumeOnboardingResponse {
  has_incomplete_onboarding: boolean;
  onboarding_id: string | null;
  current_status: OnboardingStatus | null;
  resume_url: string | null;
}

// =====================================================
// WEBHOOK TYPES
// =====================================================

export interface DocuSignWebhookPayload {
  event: string;
  envelope_id: string;
  recipient_email: string;
  signed_at: string;
  status: string;
}

export interface StripeWebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      charges_enabled: boolean;
      payouts_enabled: boolean;
      details_submitted: boolean;
    };
  };
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface OnboardingProgress {
  total_steps: number;
  completed_steps: number;
  current_step: OnboardingStep;
  percentage: number;
}

export interface OnboardingStepInfo {
  step: OnboardingStep;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  can_access: boolean;
}

// =====================================================
// SUPABASE CLIENT TYPES
// =====================================================

export type Database = {
  public: {
    Tables: {
      vendor_onboardings: {
        Row: VendorOnboarding;
        Insert: Omit<
          VendorOnboarding,
          'id' | 'created_at' | 'updated_at' | 'last_activity_at'
        >;
        Update: Partial<
          Omit<VendorOnboarding, 'id' | 'created_at'>
        >;
      };
      onboarding_audit_log: {
        Row: OnboardingAuditLog;
        Insert: Omit<OnboardingAuditLog, 'id' | 'created_at'>;
        Update: never; // Immutabile
      };
    };
    Views: {
      active_onboardings: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          business_name: string;
          status: OnboardingStatus;
          last_step_completed: OnboardingStep | null;
          created_at: string;
          updated_at: string;
          last_activity_at: string;
          hours_inactive: number;
        };
      };
      onboarding_stats: {
        Row: {
          status: OnboardingStatus;
          count: number;
          avg_hours_to_complete: number | null;
        };
      };
      admin_dashboard: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          business_name: string;
          status: OnboardingStatus;
          created_at: string;
          updated_at: string;
          docusign_signed_at: string | null;
          vendor_created_at: string | null;
          stripe_connected_at: string | null;
          completed_at: string | null;
          audit_log_count: number;
          last_audit_entry: string | null;
        };
      };
    };
    Functions: {
      can_proceed_to_next_step: {
        Args: { onboarding_uuid: string };
        Returns: {
          can_proceed: boolean;
          next_step: string | null;
          reason: string;
        }[];
      };
      validate_session_token: {
        Args: { token: string };
        Returns: {
          is_valid: boolean;
          onboarding_id: string;
          email: string;
          status: OnboardingStatus;
        }[];
      };
      email_exists: {
        Args: { p_email: string };
        Returns: boolean;
      };
      get_incomplete_onboarding_by_email: {
        Args: { p_email: string };
        Returns: {
          id: string;
          status: OnboardingStatus;
          last_step_completed: OnboardingStep | null;
          created_at: string;
          session_token: string;
        }[];
      };
      create_audit_log: {
        Args: {
          p_onboarding_id: string;
          p_action: AuditLogAction;
          p_actor_type?: ActorType;
          p_actor_id?: string;
          p_details?: Record<string, unknown>;
          p_old_status?: OnboardingStatus;
          p_new_status?: OnboardingStatus;
          p_ip_address?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
    };
  };
};
