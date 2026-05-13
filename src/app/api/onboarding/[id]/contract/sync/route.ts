/**
 * POST /api/onboarding/[id]/contract/sync
 * Verifica attivamente lo stato dell'envelope su DocuSign e processa il contratto se completato.
 * Usato come fallback quando il webhook non arriva (es. ambienti preview).
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';
import { getEnvelopeStatus } from '@/lib/docusign';
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

    // Se già processato, non fare nulla — a meno che il vendor WP non sia mai stato creato
    // (può succedere se il webhook ha aggiornato lo status ma la chiamata WP è fallita)
    if (onboarding.status !== 'contract_pending') {
      if (onboarding.status === 'contract_signed' && !onboarding.wp_user_id) {
        // Recovery: contratto firmato ma vendor WP mai creato — riprova creazione
        console.log(`Sync recovery: contract_signed but no wp_user_id for onboarding ${id} — retrying vendor creation`);
      } else {
        return apiSuccess({ status: onboarding.status, already_processed: true });
      }
    }

    const isRecovery = onboarding.status === 'contract_signed';

    if (!isRecovery) {
      if (!onboarding.docusign_envelope_id) {
        return apiError('No envelope ID found', 400);
      }

      // Chiedi direttamente a DocuSign lo stato corrente
      const envelopeStatus = await getEnvelopeStatus(onboarding.docusign_envelope_id);
      console.log(`DocuSign sync - envelope ${onboarding.docusign_envelope_id} status:`, envelopeStatus.status);

      if (envelopeStatus.status !== 'completed') {
        return apiSuccess({ status: onboarding.status, docusign_status: envelopeStatus.status });
      }

      // Contratto firmato: aggiorna status prima di creare il vendor WP
      console.log(`Contract sync: processing completed envelope for onboarding ${id}`);

      await (supabaseAdmin.from('vendor_onboardings') as any)
        .update({
          status: 'contract_signed',
          docusign_signed_at: envelopeStatus.completedDateTime || new Date().toISOString(),
          contract_pdf_url: `https://demo.docusign.net/documents/${onboarding.docusign_envelope_id}`,
        })
        .eq('id', id);

      await (supabaseAdmin.rpc as any)('create_audit_log', {
        p_onboarding_id: id,
        p_action: 'contract_signed',
        p_actor_type: 'user',
        p_old_status: onboarding.status,
        p_new_status: 'contract_signed',
        p_details: {
          envelope_id: onboarding.docusign_envelope_id,
          signed_at: envelopeStatus.completedDateTime,
          source: 'sync_endpoint',
        },
      });
    }

    if (!onboarding.email) {
      throw new Error(`Email missing for onboarding ${id} — cannot create WordPress vendor`);
    }

    if (!onboarding.temp_password) {
      throw new Error('Temporary password not found - cannot create WordPress vendor');
    }

    const wpVendor = await createWordPressVendor({
      email: onboarding.email,
      password: onboarding.temp_password,
      firstName: onboarding.first_name,
      lastName: onboarding.last_name,
      businessName: onboarding.business_name,
    });

    console.log(`WordPress vendor created via sync:`, wpVendor);

    const { error: updateError } = await (supabaseAdmin.from('vendor_onboardings') as any)
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

    if (updateError) {
      throw new Error(`Failed to update onboarding: ${updateError.message}`);
    }

    await (supabaseAdmin.rpc as any)('create_audit_log', {
      p_onboarding_id: id,
      p_action: 'vendor_created',
      p_actor_type: 'system',
      p_old_status: 'contract_signed',
      p_new_status: 'vendor_created',
      p_details: {
        wp_user_id: wpVendor.wpUserId,
        mvx_vendor_id: wpVendor.mvxVendorId,
        wp_username: wpVendor.wpUsername,
        source: 'sync_endpoint',
      },
    });

    return apiSuccess({ status: 'vendor_created', synced: true });
  } catch (error) {
    console.error('Error in contract sync:', error);
    return apiError('Failed to sync contract status', 500);
  }
}