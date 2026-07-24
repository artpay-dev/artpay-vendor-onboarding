/**
 * GET /api/artist/subscription/status — autenticato (JWT WP in header)
 * Proxy verso WP GET /status
 */

import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const WP_BASE_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) return apiError('Unauthorized', 401);

  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/subscriptions/status`, {
      headers: { Authorization: auth },
    });

    if (!res.ok) throw new Error(`WP status fetch failed: ${res.status}`);

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Subscription status error:', error);
    return apiError('Failed to fetch subscription status', 500);
  }
}