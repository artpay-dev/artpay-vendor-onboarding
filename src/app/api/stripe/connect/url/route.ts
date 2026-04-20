/**
 * POST /api/stripe/connect/url
 * Genera l'Account Link per Stripe Connect onboarding
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';
import {
  createConnectedAccount,
  createAccountLink,
} from '@/lib/stripe-connect';

export async function POST(request: NextRequest) {
  try {
    // Verifica session token
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return apiError('Unauthorized', 401);
    }

    // Parse body per ottenere onboarding_id
    const body = await request.json().catch(() => null);
    const { onboarding_id } = body || {};

    if (!onboarding_id) {
      return apiError('Missing onboarding_id', 400);
    }

    // Valida session token
    const { data: validation } = await (supabaseAdmin
      .rpc as any)('validate_session_token', { token: sessionToken });

    if (!validation || validation.length === 0 || !validation[0].is_valid) {
      return apiError('Invalid or expired session', 401);
    }

    // Verifica che l'ID corrisponda
    if (validation[0].onboarding_id !== onboarding_id) {
      return apiError('Unauthorized to access this onboarding', 403);
    }

    // Ottieni onboarding completo
    const { data: onboarding } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', onboarding_id)
      .single();

    if (!onboarding) {
      return apiError('Onboarding not found', 404);
    }

    const onboardingData = onboarding as any;

    // Verifica che sia nello stato vendor_created (può connettere Stripe)
    if (
      onboardingData.status !== 'vendor_created' &&
      onboardingData.status !== 'stripe_pending'
    ) {
      return apiError('Cannot connect Stripe at this stage', 400, {
        current_status: onboardingData.status,
      });
    }

    // Se non esiste ancora un account Stripe, crealo
    let stripeAccountId = onboardingData.stripe_account_id;

    if (!stripeAccountId) {
      console.log('Creating new Stripe Connected Account...');
      stripeAccountId = await createConnectedAccount({
        email: onboardingData.email,
        businessName: onboardingData.business_name,
        country: 'IT',
      });

      // Salva account ID su database
      await (supabaseAdmin
        .from('vendor_onboardings') as any)
        .update({
          stripe_account_id: stripeAccountId,
        })
        .eq('id', onboarding_id);

      console.log('Stripe account created and saved:', stripeAccountId);
    }

    // Genera Account Link per onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const accountLinkUrl = await createAccountLink({
      accountId: stripeAccountId,
      refreshUrl: `${baseUrl}/onboarding/stripe-connect?refresh=true`,
      returnUrl: `${baseUrl}/api/stripe/connect/return?onboarding_id=${onboarding_id}`,
    });

    console.log('Account Link generated for onboarding:', onboarding_id);

    return apiSuccess({
      stripe_url: accountLinkUrl,
      account_id: stripeAccountId,
    });
  } catch (error) {
    console.error('Error generating Stripe Connect URL:', error);
    return apiError(
      'Failed to generate Stripe Connect URL',
      500,
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

export const dynamic = 'force-dynamic';
