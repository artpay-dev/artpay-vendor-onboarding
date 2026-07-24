/**
 * POST /api/onboarding/start
 * Crea un nuovo onboarding (Step 1)
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  validateRequiredFields,
  getClientIP,
  getUserAgent,
  checkRateLimit,
  hashPassword,
  normalizeEmail,
  isValidEmail,
  generateSecureToken,
  getNextStepFromStatus,
} from '@/lib/api-utils';
import type { StartOnboardingRequest, StartOnboardingResponse } from '@/types/supabase';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request) || 'unknown';
    const rateLimit = checkRateLimit(`onboarding_start:${ip}`, 5, 300000); // 5 richieste per 5 minuti

    if (!rateLimit.allowed) {
      return apiError('Too many requests. Please try again later.', 429, {
        retry_after: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      });
    }

    // Parse body
    const body = await request.json().catch(() => null);

    const isArtistFlow = (body as any)?.flow_type === 'artist';
    const requiredFields = isArtistFlow
      ? ['email', 'password', 'first_name', 'last_name', 'business_name']
      : ['email', 'password', 'first_name', 'last_name', 'business_name', 'ragione_sociale', 'partita_iva', 'indirizzo', 'iban'];

    // Valida campi richiesti
    const validation = validateRequiredFields<StartOnboardingRequest | any>(body, requiredFields);

    if (!validation.valid) {
      return apiError('Missing required fields', 400, {
        missing_fields: validation.missing,
      });
    }

    const {
      email,
      password,
      first_name,
      last_name,
      business_name,
      ragione_sociale,
      partita_iva,
      indirizzo,
      iban,
      flow_type = 'vendor',
      subscription_plan,
      subscription_plan_amount,
    } = body as StartOnboardingRequest & { flow_type?: string; subscription_plan?: string; subscription_plan_amount?: number };

    // Valida email
    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return apiError('Invalid email format', 400);
    }

    // Valida password (minimo 6 caratteri)
    if (password.length < 6) {
      return apiError('Password must be at least 6 characters', 400);
    }

    // Valida nomi
    if (first_name.trim().length < 2 || last_name.trim().length < 2) {
      return apiError('First name and last name must be at least 2 characters', 400);
    }

    if (business_name.trim().length < 2) {
      return apiError('Business name must be at least 2 characters', 400);
    }

    // Verifica se email già esiste
    const { data: existingEmail } = await (supabaseAdmin
      .rpc as any)('email_exists', { p_email: normalizedEmail });

    if (existingEmail) {
      // Verifica se ha un onboarding incompleto
      const { data: incompleteOnboarding } = await (supabaseAdmin
        .rpc as any)('get_incomplete_onboarding_by_email', { p_email: normalizedEmail });

      if (incompleteOnboarding && incompleteOnboarding.length > 0) {
        const existing = incompleteOnboarding[0];
        return apiError('An incomplete onboarding already exists for this email', 409, {
          onboarding_id: existing.id,
          status: existing.status,
          can_resume: true,
          resume_url: getNextStepFromStatus(existing.status),
        });
      }

      return apiError('Email already registered', 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Genera session token
    const sessionToken = generateSecureToken();
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 giorni

    // Crea onboarding
    const { data: onboarding, error: createError } = await (supabaseAdmin
      .from('vendor_onboardings') as any)
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        temp_password: password, // Store plaintext temporarily for WordPress creation
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        business_name: business_name.trim(),
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
        status: 'draft',
        last_step_completed: 'registration',
        session_token: sessionToken,
        session_expires_at: sessionExpiresAt.toISOString(),
        metadata: {
          ragione_sociale: ragione_sociale?.trim() || '',
          partita_iva: partita_iva?.trim().replace(/\s/g, '').toUpperCase() || '',
          indirizzo: indirizzo?.trim() || '',
          iban: iban?.trim().replace(/\s/g, '').toUpperCase() || '',
          flow_type,
          ...(subscription_plan ? { subscription_plan } : {}),
          ...(subscription_plan_amount ? { subscription_plan_amount } : {}),
        },
      })
      .select()
      .single();

    if (createError || !onboarding) {
      console.error('Error creating onboarding:', createError);
      return apiError('Failed to create onboarding', 500);
    }

    // Crea audit log
    await (supabaseAdmin.rpc as any)('create_audit_log', {
      p_onboarding_id: onboarding.id,
      p_action: 'created',
      p_actor_type: 'user',
      p_new_status: 'draft',
      p_details: {
        email: normalizedEmail,
        business_name: business_name.trim(),
      },
      p_ip_address: ip,
      p_user_agent: getUserAgent(request),
    });

    // Prepara response
    const isArtist = flow_type === 'artist';
    const response: StartOnboardingResponse = {
      onboarding_id: onboarding.id,
      session_token: sessionToken,
      status: 'draft',
      next_step: 'contract',
      next_url: isArtist ? '/artista/abbonamento' : '/onboarding/contract',
    };

    return apiSuccess(response, 201);
  } catch (error) {
    console.error('Unexpected error in /api/onboarding/start:', error);
    return apiError('Internal server error', 500);
  }
}
