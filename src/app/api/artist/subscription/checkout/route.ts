/**
 * POST /api/artist/subscription/checkout
 * Autentica l'artista su WP, crea la Stripe Checkout session e ritorna l'URL.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WP_BASE_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

async function getWordPressJWT(username: string, password: string): Promise<string> {
  const res = await fetch(`${WP_BASE_URL}/wp-json/jwt-auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WP JWT auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.token) throw new Error('WP JWT response missing token');
  return data.token;
}

export async function POST(request: NextRequest) {
  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) return apiError('Unauthorized', 401);

    const { data: validation } = await (supabaseAdmin.rpc as any)('validate_session_token', {
      token: sessionToken,
    });

    if (!validation?.[0]?.is_valid) return apiError('Invalid or expired session', 401);

    const onboardingId = validation[0].onboarding_id;

    const { data: onboarding, error } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (error || !onboarding) return apiError('Onboarding not found', 404);

    const meta = (onboarding as any).metadata || {};
    const plan: string = meta.subscription_plan || 'monthly';
    const wpUsername: string = (onboarding as any).wp_username;
    const wpPassword: string = meta.wp_password;

    if (!wpUsername || !wpPassword) {
      return apiError('WP credentials not available. Complete the onboarding first.', 400);
    }

    // Ottieni JWT WP
    const wpToken = await getWordPressJWT(wpUsername, wpPassword);

    // Chiama WP /checkout
    const checkoutRes = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/subscriptions/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${wpToken}`,
      },
      body: JSON.stringify({ plan }),
    });

    if (checkoutRes.status === 409) {
      return apiError('Hai già un abbonamento attivo', 409);
    }

    if (!checkoutRes.ok) {
      const body = await checkoutRes.text();
      throw new Error(`WP checkout failed (${checkoutRes.status}): ${body}`);
    }

    const checkoutData = await checkoutRes.json();

    return apiSuccess({
      checkout_url: checkoutData.checkout_url,
      session_id: checkoutData.session_id,
      trial_days: checkoutData.trial_days ?? 0,
    });
  } catch (error) {
    console.error('Artist subscription checkout error:', error);
    return apiError('Failed to create checkout session', 500, {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}