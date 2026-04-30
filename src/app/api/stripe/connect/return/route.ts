/**
 * GET /api/stripe/connect/return
 * Return endpoint dopo il completamento dell'onboarding Stripe
 */

import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getAccountStatus } from '@/lib/stripe-connect';
import { updateVendorStripeAccount } from '@/lib/wordpress';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const onboardingId = searchParams.get('onboarding_id');

    if (!onboardingId) {
      console.error('Missing onboarding_id parameter');
      return redirect('/onboarding/stripe-connect?error=invalid_request');
    }

    console.log('Stripe Connect return for onboarding:', onboardingId);

    // Verifica che l'onboarding esista
    const { data: onboarding } = await supabaseAdmin
      .from('vendor_onboardings')
      .select('*')
      .eq('id', onboardingId)
      .single();

    if (!onboarding) {
      console.error('Onboarding not found:', onboardingId);
      return redirect('/onboarding/stripe-connect?error=onboarding_not_found');
    }

    const onboardingData = onboarding as any;

    if (!onboardingData.stripe_account_id) {
      console.error('No Stripe account ID found for onboarding:', onboardingId);
      return redirect('/onboarding/stripe-connect?error=no_account');
    }

    console.log('Verifying Stripe account status...');

    // Verifica lo stato dell'account Stripe
    const accountStatus = await getAccountStatus(onboardingData.stripe_account_id);

    console.log('Stripe account status:', {
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
    });

    // Aggiorna onboarding con status Stripe
    await (supabaseAdmin
      .from('vendor_onboardings') as any)
      .update({
        status: accountStatus.detailsSubmitted ? 'completed' : 'stripe_pending',
        stripe_connected_at: accountStatus.detailsSubmitted
          ? new Date().toISOString()
          : null,
        stripe_charges_enabled: accountStatus.chargesEnabled,
        stripe_payouts_enabled: accountStatus.payoutsEnabled,
        stripe_details_submitted: accountStatus.detailsSubmitted,
      })
      .eq('id', onboardingId);

    // Se onboarding completato, procedi con resto del flusso
    if (accountStatus.detailsSubmitted) {
      console.log('Stripe onboarding completed successfully');

      // Audit log: stripe_connected
      await (supabaseAdmin.rpc as any)('create_audit_log', {
        p_onboarding_id: onboardingId,
        p_action: 'stripe_connected',
        p_actor_type: 'user',
        p_old_status: onboardingData.status,
        p_new_status: 'completed',
        p_details: {
          stripe_account_id: onboardingData.stripe_account_id,
          charges_enabled: accountStatus.chargesEnabled,
          payouts_enabled: accountStatus.payoutsEnabled,
        },
      });

      // Aggiorna WordPress con Stripe account ID (best effort)
      if (onboardingData.wp_user_id) {
        try {
          await updateVendorStripeAccount(
            onboardingData.wp_user_id,
            onboardingData.stripe_account_id
          );
          console.log('WordPress vendor updated with Stripe account');
        } catch (error) {
          console.warn('Failed to update WordPress vendor:', error);
        }
      }

      // Invia email di conferma
      try {
        const { sendOnboardingCompletionEmail } = await import('@/lib/email');
        await sendOnboardingCompletionEmail({
          email: onboardingData.email,
          firstName: onboardingData.first_name,
          lastName: onboardingData.last_name,
          businessName: onboardingData.business_name,
          wpUsername: onboardingData.wp_username,
        });
        console.log('Confirmation email sent successfully');
      } catch (error) {
        console.error('Failed to send confirmation email:', error);
        await (supabaseAdmin.rpc as any)('create_audit_log', {
          p_onboarding_id: onboardingId,
          p_action: 'error',
          p_actor_type: 'system',
          p_details: {
            error: 'Failed to send confirmation email',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      console.log('Onboarding completed successfully!');

      // Usa redirect relativo per mantenere il dominio corrente (localhost o ngrok)
      const { headers } = request;
      const host = headers.get('host') || 'localhost:3000';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      return redirect(`${protocol}://${host}/onboarding/completed?onboarding_id=${onboardingId}`);
    } else {
      console.log('Stripe onboarding incomplete - requirements pending');
      return redirect(
        '/onboarding/stripe-connect?status=incomplete&requirements=' +
          encodeURIComponent(JSON.stringify(accountStatus.requirements.currentlyDue))
      );
    }
  } catch (error: any) {
    // NEXT_REDIRECT è un errore normale di Next.js, non è un vero errore
    if (error?.digest?.includes('NEXT_REDIRECT')) {
      throw error; // Re-throw per far funzionare il redirect
    }

    console.error('Error in Stripe Connect return:', error);
    return redirect('/onboarding/stripe-connect?error=internal_error');
  }
}

export const dynamic = 'force-dynamic';
