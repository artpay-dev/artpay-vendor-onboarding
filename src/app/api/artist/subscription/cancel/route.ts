/**
 * POST /api/artist/subscription/cancel — autenticato (JWT WP in header)
 * Proxy verso WP POST /cancel
 */

import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const WP_BASE_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) return apiError('Unauthorized', 401);

  try {
    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`WP cancel failed: ${res.status}`);

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    return apiError('Failed to cancel subscription', 500);
  }
}