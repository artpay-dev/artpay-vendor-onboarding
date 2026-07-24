/**
 * POST /api/artist/subscription/confirm
 * Verifica una Stripe Checkout Session e segna subscription_paid in Supabase.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return apiError('Unauthorized', 401);
    }

    const { data: validation } = await (supabaseAdmin.rpc as any)('validate_session_token', {
      token: sessionToken,
    });

    if (!validation || validation.length === 0 || !validation[0].is_valid) {
      return apiError('Invalid or expired session', 401);
    }

    const onboardingId = validation[0].onboarding_id;

    const body = await request.json().catch(() => null);
    const stripeSessionId = body?.session_id;

    if (!stripeSessionId) {
      return apiError('Missing session_id', 400);
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

    if (session.metadata?.onboarding_id !== onboardingId) {
      return apiError('Session does not match this onboarding', 403);
    }

    if (session.payment_status !== 'paid') {
      return apiError('Payment not completed', 402);
    }

    const { data: onboardingData } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('metadata')
      .eq('id', onboardingId)
      .single();

    const currentMeta = (onboardingData as any)?.metadata || {};

    await (supabaseAdmin.from('vendor_onboardings') as any)
      .update({
        metadata: {
          ...currentMeta,
          subscription_paid: true,
          stripe_subscription_id: session.subscription as string | null,
          stripe_customer_id: session.customer as string | null,
        },
      })
      .eq('id', onboardingId);

    await (supabaseAdmin.rpc as any)('create_audit_log', {
      p_onboarding_id: onboardingId,
      p_action: 'subscription_paid',
      p_actor_type: 'user',
      p_details: {
        stripe_session_id: stripeSessionId,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
      },
    });

    return apiSuccess({ subscription_paid: true });
  } catch (error) {
    console.error('Error confirming subscription:', error);
    return apiError('Failed to confirm subscription', 500);
  }
}