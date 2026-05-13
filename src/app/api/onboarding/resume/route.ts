/**
 * GET /api/onboarding/resume?email={email}
 * Verifica se esiste un onboarding incompleto per un email
 */

import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  normalizeEmail,
  isValidEmail,
  getNextStepFromStatus,
} from '@/lib/api-utils';
import type { ResumeOnboardingResponse } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return apiError('Email parameter is required', 400);
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return apiError('Invalid email format', 400);
    }

    // Cerca onboarding incompleto
    const { data: incompleteOnboarding } = await (supabaseAdmin
      .rpc as any)('get_incomplete_onboarding_by_email', { p_email: normalizedEmail });

    if (!incompleteOnboarding || incompleteOnboarding.length === 0) {
      const response: ResumeOnboardingResponse = {
        has_incomplete_onboarding: false,
        onboarding_id: null,
        current_status: null,
        resume_url: null,
      };
      return apiSuccess(response);
    }

    const existing = incompleteOnboarding[0];
    const response: ResumeOnboardingResponse = {
      has_incomplete_onboarding: true,
      onboarding_id: existing.id,
      current_status: existing.status,
      resume_url: getNextStepFromStatus(existing.status),
    };

    return apiSuccess(response);
  } catch (error) {
    console.error('Unexpected error in /api/onboarding/resume:', error);
    return apiError('Internal server error', 500);
  }
}

/**
 * POST /api/onboarding/resume
 * Riprende un onboarding incompleto tramite email e restituisce il session token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (!email) {
      return apiError('Email obbligatoria', 400);
    }

    const normalizedEmail = normalizeEmail(email);
    if (!isValidEmail(normalizedEmail)) {
      return apiError('Formato email non valido', 400);
    }

    const { data: incompleteOnboarding } = await (supabaseAdmin
      .rpc as any)('get_incomplete_onboarding_by_email', { p_email: normalizedEmail });

    if (!incompleteOnboarding || incompleteOnboarding.length === 0) {
      return apiError('Nessuna registrazione in corso trovata per questa email', 404);
    }

    const existing = incompleteOnboarding[0];

    // Rinnova session_expires_at nel DB così validate_session_token non fallisce
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await (supabaseAdmin.from('vendor_onboardings') as any)
      .update({ session_expires_at: newExpiry })
      .eq('id', existing.id);

    return apiSuccess({
      onboarding_id: existing.id,
      session_token: existing.session_token,
      resume_url: getNextStepFromStatus(existing.status),
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/onboarding/resume:', error);
    return apiError('Internal server error', 500);
  }
}
