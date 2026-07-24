/**
 * POST /api/artist/subscription/portal — autenticato (JWT WP in header)
 * Proxy verso WP POST /portal
 */

import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const WP_BASE_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth) return apiError('Unauthorized', 401);

  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/subscriptions/portal`, {
      method: 'POST',
      headers: { Authorization: auth },
    });

    if (!res.ok) throw new Error(`WP portal failed: ${res.status}`);

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Subscription portal error:', error);
    return apiError('Failed to get portal URL', 500);
  }
}