/**
 * POST /api/webhooks/docusign
 * Webhook endpoint per ricevere eventi da DocuSign
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-utils';
import { downloadSignedContract } from '@/lib/docusign';
import { createWordPressVendor } from '@/lib/wordpress';

export async function POST(request: NextRequest) {
  try {
    // Parse il body XML di DocuSign
    const body = await request.text();

    // DocuSign invia XML, dobbiamo parsarlo
    // Nota: In produzione dovresti validare la firma HMAC di DocuSign
    const xmlData = await parseDocuSignXML(body);

    console.log('DocuSign webhook received:', xmlData);

    const { envelopeId, status, recipientEmail, completedDateTime } = xmlData;

    if (!envelopeId) {
      return apiError('Missing envelope ID', 400);
    }

    // Trova l'onboarding associato all'envelope
    const { data: onboardings } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('docusign_envelope_id', envelopeId)
      .limit(1);

    if (!onboardings || onboardings.length === 0) {
      console.warn(`No onboarding found for envelope ${envelopeId}`);
      return apiSuccess({ message: 'Envelope not found, ignored' });
    }

    const onboarding = onboardings[0] as any;

    // Gestisci gli eventi in base allo status
    if (status === 'completed') {
      // Se già processato (es. dal sync endpoint), non fare nulla
      if (onboarding.status !== 'contract_pending') {
        console.log(`Webhook: onboarding ${onboarding.id} already processed (status: ${onboarding.status}), skipping`);
        return apiSuccess({ message: 'Already processed' });
      }

      // Contratto firmato!
      try {
        console.log(`Contract signed for onboarding ${onboarding.id} - Starting vendor creation...`);

        // 1. Aggiorna onboarding a contract_signed
        await (supabaseAdmin
          .from('vendor_onboardings') as any)
          .update({
            status: 'contract_signed',
            docusign_signed_at: completedDateTime || new Date().toISOString(),
            contract_pdf_url: `https://demo.docusign.net/documents/${envelopeId}`,
          })
          .eq('id', onboarding.id);

        // 2. Audit log: contract_signed
        await (supabaseAdmin.rpc as any)('create_audit_log', {
          p_onboarding_id: onboarding.id,
          p_action: 'contract_signed',
          p_actor_type: 'user',
          p_old_status: onboarding.status,
          p_new_status: 'contract_signed',
          p_details: {
            envelope_id: envelopeId,
            signed_at: completedDateTime,
            recipient_email: recipientEmail,
          },
        });

        console.log(`Contract signed - Now creating WordPress vendor...`);

        // 3. AUTOMATICO: Crea vendor su WordPress
        if (!onboarding.temp_password) {
          throw new Error('Temporary password not found - cannot create WordPress vendor');
        }

        const wpVendor = await createWordPressVendor({
          email: onboarding.email,
          password: onboarding.temp_password, // Use plaintext password for WordPress
          firstName: onboarding.first_name,
          lastName: onboarding.last_name,
          businessName: onboarding.business_name,
        });

        console.log(`WordPress vendor created successfully:`, wpVendor);

        // 4. Aggiorna onboarding con dati WordPress e cancella password temporanea
        console.log(`Updating onboarding ${onboarding.id} to vendor_created...`);

        const { data: updateData, error: updateError } = await (supabaseAdmin
          .from('vendor_onboardings') as any)
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
          .eq('id', onboarding.id)
          .select();

        if (updateError) {
          console.error('ERROR updating onboarding to vendor_created:', updateError);
          throw new Error(`Failed to update onboarding: ${updateError.message}`);
        }

        console.log(`Onboarding updated successfully:`, updateData);

        // 5. Audit log: vendor_created
        await (supabaseAdmin.rpc as any)('create_audit_log', {
          p_onboarding_id: onboarding.id,
          p_action: 'vendor_created',
          p_actor_type: 'system',
          p_old_status: 'contract_signed',
          p_new_status: 'vendor_created',
          p_details: {
            wp_user_id: wpVendor.wpUserId,
            mvx_vendor_id: wpVendor.mvxVendorId,
            wp_username: wpVendor.wpUsername,
          },
        });

        console.log(`Vendor creation completed for onboarding ${onboarding.id}`);
      } catch (error) {
        console.error('Error processing signed contract:', error);

        // Se la creazione WordPress fallisce, logga l'errore ma non bloccare
        await (supabaseAdmin.rpc as any)('create_audit_log', {
          p_onboarding_id: onboarding.id,
          p_action: 'error',
          p_actor_type: 'system',
          p_details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            step: 'wordpress_vendor_creation',
          },
        });

        throw error;
      }
    } else if (status === 'declined') {
      // Contratto rifiutato
      await (supabaseAdmin
        .from('vendor_onboardings') as any)
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Contract declined by user',
        })
        .eq('id', onboarding.id);

      await (supabaseAdmin.rpc as any)('create_audit_log', {
        p_onboarding_id: onboarding.id,
        p_action: 'rejected',
        p_actor_type: 'user',
        p_old_status: onboarding.status,
        p_new_status: 'rejected',
        p_details: {
          envelope_id: envelopeId,
          reason: 'Contract declined',
        },
      });
    } else if (status === 'voided') {
      // Contratto annullato
      await (supabaseAdmin
        .from('vendor_onboardings') as any)
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: 'Contract voided',
        })
        .eq('id', onboarding.id);

      await (supabaseAdmin.rpc as any)('create_audit_log', {
        p_onboarding_id: onboarding.id,
        p_action: 'rejected',
        p_actor_type: 'system',
        p_old_status: onboarding.status,
        p_new_status: 'rejected',
        p_details: {
          envelope_id: envelopeId,
          reason: 'Contract voided',
        },
      });
    }

    return apiSuccess({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Error processing DocuSign webhook:', error);
    return apiError('Failed to process webhook', 500);
  }
}

/**
 * Parser semplice per XML di DocuSign
 * Nota: In produzione usa una libreria XML come fast-xml-parser
 */
async function parseDocuSignXML(xmlString: string) {
  // Questo è un parser molto basic - in produzione usa fast-xml-parser o simili
  const envelopeIdMatch = xmlString.match(/<EnvelopeID>(.*?)<\/EnvelopeID>/);
  const statusMatch = xmlString.match(/<Status>(.*?)<\/Status>/);
  const emailMatch = xmlString.match(/<Email>(.*?)<\/Email>/);
  const completedMatch = xmlString.match(/<Completed>(.*?)<\/Completed>/);

  return {
    envelopeId: envelopeIdMatch ? envelopeIdMatch[1] : null,
    status: statusMatch ? statusMatch[1].toLowerCase() : null,
    recipientEmail: emailMatch ? emailMatch[1] : null,
    completedDateTime: completedMatch ? completedMatch[1] : null,
  };
}

// Permetti POST da DocuSign senza CSRF protection
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Force Node.js runtime (docusign-esign non funziona con Edge)
