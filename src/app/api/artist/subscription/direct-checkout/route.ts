/**
 * POST /api/artist/subscription/direct-checkout
 * Crea una Stripe Checkout Session per l'abbonamento artista.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';

const PRICE_IDS: Record<string, string> = {
  annual: 'price_1Tqwp1BVvRJjw4FG5WIZMFPb',
  monthly: 'price_1TrJwgBVvRJjw4FG691pKYRi',
};

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

    const { data: onboardingData, error: fetchError } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (fetchError || !onboardingData) {
      return apiError('Onboarding not found', 404);
    }

    const onboarding = onboardingData as any;

    if (onboarding.metadata?.subscription_paid) {
      return apiError('Subscription already paid', 409);
    }

    const plan: string = onboarding.metadata?.subscription_plan || 'monthly';
    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      return apiError(`Unknown subscription plan: ${plan}`, 400);
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: onboarding.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { onboarding_id: onboardingId },
      success_url: `${baseUrl}/artista/contratto?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/artista/abbonamento?cancelled=true`,
    });

    return apiSuccess({ checkout_url: session.url });
  } catch (error) {
    console.error('Error creating subscription checkout session:', error);
    return apiError('Failed to create checkout session', 500);
  }
}