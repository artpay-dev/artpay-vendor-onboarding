/**
 * POST /api/onboarding/[id]/sso
 * Genera un token SSO monouso per accedere alla dashboard WordPress
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WP_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;
const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.artpay.art';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    if (validation[0].onboarding_id !== id) {
      return apiError('Unauthorized', 403);
    }

    const { data: onboarding } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('wp_username, metadata')
      .eq('id', id)
      .single();

    if (!onboarding) {
      return apiError('Onboarding not found', 404);
    }

    const data = onboarding as any;
    const wpUsername = data.wp_username;
    const wpPassword = data.metadata?.wp_password;

    if (!wpUsername || !wpPassword) {
      return apiError('Credenziali WordPress non disponibili', 400);
    }

    if (!WP_URL) {
      return apiError('Server WordPress non configurato', 500);
    }

    // Chiama il plugin SSO di WordPress per generare il token monouso
    const ssoResponse = await fetch(
      `${WP_URL}/wp-json/artpay-sso/v1/generate-token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: wpUsername, password: wpPassword }),
      }
    );

    if (!ssoResponse.ok) {
      const err = await ssoResponse.json().catch(() => ({}));
      console.error('SSO generate-token failed:', err);
      return apiError('Generazione token SSO fallita', 502);
    }

    const { token } = await ssoResponse.json();

    return apiSuccess({
      redirect_url: `${DASHBOARD_URL}?token=${token}`,
    });
  } catch (error) {
    console.error('Error in SSO endpoint:', error);
    return apiError('Internal server error', 500);
  }
}