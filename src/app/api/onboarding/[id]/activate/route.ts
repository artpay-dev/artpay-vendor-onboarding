/**
 * POST /api/onboarding/[id]/activate
 * Crea il vendor WordPress direttamente, senza DocuSign (flusso no-contract).
 * Idempotente: se il vendor è già stato creato restituisce success.
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';
import { createWordPressVendor } from '@/lib/wordpress';

export const runtime = 'nodejs';
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
      return apiError('Unauthorized to access this onboarding', 403);
    }

    const { data: onboardingData, error: fetchError } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !onboardingData) {
      return apiError('Onboarding not found', 404);
    }

    const onboarding = onboardingData as any;
    const skipContract = onboarding.metadata?.skip_contract === true;

    console.log('Activate endpoint - onboarding:', {
      id: onboarding.id,
      status: onboarding.status,
      skipContract,
      hasEmail: !!onboarding.email,
      hasTempPassword: !!onboarding.temp_password,
      metadata: onboarding.metadata,
    });

    // Idempotente: già creato
    if (onboarding.status === 'vendor_created' || onboarding.wp_user_id) {
      return apiSuccess({ status: 'vendor_created', already_created: true });
    }

    if (!skipContract) {
      return apiError('This onboarding requires contract signing', 400);
    }

    if (onboarding.status !== 'draft') {
      return apiError(`Cannot activate from status: ${onboarding.status}`, 400);
    }

    if (!onboarding.email) {
      return apiError('Missing email in onboarding data', 500);
    }

    if (!onboarding.temp_password) {
      return apiError('Missing temp_password in onboarding data', 500);
    }

    // Transizione draft → pending_approval (valida per flusso no-contract)
    const { error: toPendingError } = await (supabaseAdmin.from('vendor_onboardings') as any)
      .update({ status: 'pending_approval' })
      .eq('id', id);

    if (toPendingError) {
      throw new Error(`Failed to update onboarding: ${toPendingError.message}`);
    }

    const wpVendor = await createWordPressVendor({
      email: onboarding.email,
      password: onboarding.temp_password,
      firstName: onboarding.first_name,
      lastName: onboarding.last_name,
      businessName: onboarding.business_name,
    });

    // Transizione pending_approval → vendor_created (già valida nel trigger originale)
    const { error: toCreatedError } = await (supabaseAdmin.from('vendor_onboardings') as any)
      .update({
        status: 'vendor_created',
        wp_user_id: wpVendor.wpUserId,
        mvx_vendor_id: wpVendor.mvxVendorId,
        wp_username: wpVendor.wpUsername,
        vendor_created_at: new Date().toISOString(),
        consumer_key: wpVendor.consumerKey,
        consumer_secret: wpVendor.consumerSecret,
        temp_password: null,
        metadata: {
          ...(onboarding.metadata || {}),
          wp_password: onboarding.temp_password,
        },
      })
      .eq('id', id);

    if (toCreatedError) {
      throw new Error(`Failed to update onboarding: ${toCreatedError.message}`);
    }

    await (supabaseAdmin.rpc as any)('create_audit_log', {
      p_onboarding_id: id,
      p_action: 'vendor_created',
      p_actor_type: 'system',
      p_old_status: 'draft',
      p_new_status: 'vendor_created',
      p_details: {
        wp_user_id: wpVendor.wpUserId,
        mvx_vendor_id: wpVendor.mvxVendorId,
        wp_username: wpVendor.wpUsername,
        source: 'activate_no_contract',
      },
    });

    return apiSuccess({ status: 'vendor_created', synced: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in activate endpoint:', message, error);
    return apiError(`Failed to activate vendor: ${message}`, 500);
  }
}