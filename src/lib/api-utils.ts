/**
 * API Utilities
 * Helper functions per le API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import type { OnboardingStatus } from '@/types/supabase';

/**
 * Risposta di successo standardizzata
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * Risposta di errore standardizzata
 */
export function apiError(
  message: string,
  status = 400,
  details?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        ...details,
      },
    },
    { status }
  );
}

/**
 * Estrae il session token dal header o cookie
 */
export function getSessionToken(request: NextRequest): string | null {
  // Prova Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Prova cookie
  const cookieToken = request.cookies.get('session_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Estrae IP address dalla richiesta
 */
export function getClientIP(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  return null;
}

/**
 * Estrae User Agent dalla richiesta
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent');
}

/**
 * Valida che un body contenga tutti i campi richiesti
 */
export function validateRequiredFields<T extends Record<string, unknown>>(
  body: unknown,
  requiredFields: (keyof T)[]
): { valid: boolean; missing?: string[] } {
  if (!body || typeof body !== 'object') {
    return { valid: false };
  }

  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!(field in body) || (body as Record<string, unknown>)[field as string] === undefined) {
      missing.push(field as string);
    }
  }

  if (missing.length > 0) {
    return { valid: false, missing };
  }

  return { valid: true };
}

/**
 * Mappa status onboarding a prossimo step
 */
export function getNextStepFromStatus(status: OnboardingStatus): string | null {
  const stepMap: Record<OnboardingStatus, string | null> = {
    draft: '/onboarding/contract',
    contract_pending: '/onboarding/contract',
    contract_signed: '/onboarding/pending-approval',
    pending_approval: '/onboarding/pending-approval',
    vendor_created: '/onboarding/stripe-connect',
    stripe_pending: '/onboarding/stripe-connect',
    stripe_connected: '/onboarding/completed',
    completed: '/dashboard',
    rejected: '/onboarding/rejected',
    expired: '/onboarding/expired',
  };

  return stepMap[status] || null;
}

/**
 * Verifica se un onboarding può procedere
 */
export function canProceedToStripe(status: OnboardingStatus): boolean {
  return status === 'vendor_created';
}

/**
 * Genera un token sicuro
 */
export function generateSecureToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

/**
 * Hash password con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 10);
}

/**
 * Verifica password con bcrypt
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Normalizza email (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Valida formato email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Rate limiting helper (semplice in-memory)
 * Per produzione, usare Redis o Upstash
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests = 10,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Cleanup rate limit map periodicamente
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Cleanup ogni minuto
