/**
 * POST /api/onboarding/[id]/contract
 * Genera il link DocuSign per firmare il contratto
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError, getSessionToken } from '@/lib/api-utils';
import { createVendorContractEnvelope, getEmbeddedSigningUrl } from '@/lib/docusign';
import type { GetContractLinkResponse } from '@/types/supabase';

// Force Node.js runtime (docusign-esign non funziona con Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
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

    // Valida session token
    const { data: validation } = await (supabaseAdmin
      .rpc as any)('validate_session_token', { token: sessionToken });

    if (!validation || validation.length === 0 || !validation[0].is_valid) {
      return apiError('Invalid or expired session', 401);
    }

    // Verifica che l'ID corrisponda
    if (validation[0].onboarding_id !== id) {
      return apiError('Unauthorized to access this onboarding', 403);
    }

    // Ottieni onboarding
    const { data: onboarding, error: fetchError } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !onboarding) {
      return apiError('Onboarding not found', 404);
    }

    const onboardingData = onboarding as any;

    // Verifica che sia nello stato corretto
    if (onboardingData.status !== 'draft' && onboardingData.status !== 'contract_pending') {
      return apiError('Contract already processed or onboarding in wrong state', 400, {
        current_status: onboardingData.status,
      });
    }

    // Se esiste già un envelope, restituisci quello
    if (onboardingData.docusign_envelope_id) {
      try {
        const signingUrl = await getEmbeddedSigningUrl({
          envelopeId: onboardingData.docusign_envelope_id,
          signerEmail: onboardingData.email,
          signerName: `${onboardingData.first_name} ${onboardingData.last_name}`,
          onboardingId: id,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/pending-approval?from=docusign&onboarding_id=${id}`,
        });

        const response: GetContractLinkResponse = {
          docusign_url: signingUrl,
          envelope_id: onboardingData.docusign_envelope_id,
        };

        return apiSuccess(response);
      } catch (error) {
        console.error('Error getting existing envelope:', error);
        // Se fallisce, crea un nuovo envelope
      }
    }

    // Crea nuovo envelope DocuSign
    const { envelopeId } = await createVendorContractEnvelope({
      signerEmail: onboardingData.email,
      signerName: `${onboardingData.first_name} ${onboardingData.last_name}`,
      businessName: onboardingData.business_name,
      onboardingId: id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/pending-approval?from=docusign`,
    });

    // Ottieni URL per firma embedded
    const signingUrl = await getEmbeddedSigningUrl({
      envelopeId,
      signerEmail: onboardingData.email,
      signerName: `${onboardingData.first_name} ${onboardingData.last_name}`,
      onboardingId: id,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/pending-approval?from=docusign&onboarding_id=${id}`,
    });

    // Aggiorna onboarding con envelope ID
    await (supabaseAdmin
      .from('vendor_onboardings') as any)
      .update({
        docusign_envelope_id: envelopeId,
        docusign_recipient_email: onboardingData.email,
        status: 'contract_pending',
        last_step_completed: 'contract',
      })
      .eq('id', id);

    // Crea audit log
    await (supabaseAdmin.rpc as any)('create_audit_log', {
      p_onboarding_id: id,
      p_action: 'contract_sent',
      p_actor_type: 'system',
      p_old_status: onboardingData.status,
      p_new_status: 'contract_pending',
      p_details: {
        envelope_id: envelopeId,
        recipient_email: onboardingData.email,
      },
    });

    const response: GetContractLinkResponse = {
      docusign_url: signingUrl,
      envelope_id: envelopeId,
    };

    return apiSuccess(response);
  } catch (error) {
    console.error('Unexpected error in /api/onboarding/[id]/contract:', error);
    return apiError(
      'Failed to create contract',
      500,
      {
        message: error instanceof Error ? error.message : 'Unknown error',
      }
    );
  }
}
