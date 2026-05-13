/**
 * POST /api/onboarding/[id]/save-for-later
 * Invia email di riepilogo quando l'utente clicca "Salva per dopo"
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';
import { sendSaveForLaterEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

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
      .select('email, first_name, business_name')
      .eq('id', id)
      .single();

    if (!onboarding) {
      return apiError('Onboarding not found', 404);
    }

    const data = onboarding as any;

    await sendSaveForLaterEmail({
      email: data.email,
      firstName: data.first_name,
      businessName: data.business_name,
    });

    return apiSuccess({ sent: true });
  } catch (error) {
    console.error('Error sending save-for-later email:', error);
    // Non bloccare il redirect — l'email è best-effort
    return apiSuccess({ sent: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}