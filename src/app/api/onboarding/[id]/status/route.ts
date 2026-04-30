/**
 * GET /api/onboarding/[id]/status
 * Ottiene lo stato corrente di un onboarding
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  getSessionToken,
  getNextStepFromStatus,
} from '@/lib/api-utils';
import type { GetOnboardingStatusResponse, OnboardingStep } from '@/types/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verifica session token
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return apiError('Unauthorized', 401);
    }

    // Valida session token e ottieni onboarding
    const { data: validation } = await (supabaseAdmin
      .rpc as any)('validate_session_token', { token: sessionToken });

    if (!validation || validation.length === 0 || !validation[0].is_valid) {
      return apiError('Invalid or expired session', 401);
    }

    // Verifica che l'ID corrisponda
    if (validation[0].onboarding_id !== id) {
      return apiError('Unauthorized to access this onboarding', 403);
    }

    // Ottieni onboarding completo
    const { data: onboardingData, error } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !onboardingData) {
      return apiError('Onboarding not found', 404);
    }

    // Type assertion per risolvere problemi di type inference di Supabase
    const onboarding = onboardingData as any;

    // Determina step completati e pendenti
    const allSteps: OnboardingStep[] = [
      'registration',
      'contract',
      'approval',
      'vendor_creation',
      'stripe',
      'completed',
    ];

    const statusToStepMap: Record<string, number> = {
      draft: 0,
      contract_pending: 1,
      contract_signed: 2,
      pending_approval: 2,
      vendor_created: 3,
      stripe_pending: 4,
      stripe_connected: 4,
      completed: 5,
    };

    const currentStepIndex = statusToStepMap[onboarding.status] || 0;
    const completedSteps = allSteps.slice(0, currentStepIndex + 1);
    const pendingSteps = allSteps.slice(currentStepIndex + 1);

    // Determina se può procedere
    const { data: canProceed } = await (supabaseAdmin
      .rpc as any)('can_proceed_to_next_step', { onboarding_uuid: id });

    const canProceedResult = canProceed && canProceed.length > 0 ? canProceed[0] : null;

    // Prepara response
    const response: GetOnboardingStatusResponse = {
      onboarding_id: onboarding.id,
      status: onboarding.status,
      current_step: onboarding.last_step_completed || 'registration',
      can_proceed: canProceedResult?.can_proceed || false,
      next_url: getNextStepFromStatus(onboarding.status),
      completed_steps: completedSteps,
      pending_steps: pendingSteps,
      data: {
        email: onboarding.email,
        first_name: onboarding.first_name,
        last_name: onboarding.last_name,
        business_name: onboarding.business_name,
        docusign_signed_at: onboarding.docusign_signed_at,
        stripe_account_id: onboarding.stripe_account_id,
        stripe_charges_enabled: onboarding.stripe_charges_enabled,
        stripe_payouts_enabled: onboarding.stripe_payouts_enabled,
        created_at: onboarding.created_at,
        updated_at: onboarding.updated_at,
      },
    };

    console.log(response);

    return apiSuccess(response);
  } catch (error) {
    console.error('Unexpected error in /api/onboarding/[id]/status:', error);
    return apiError('Internal server error', 500);
  }
}
