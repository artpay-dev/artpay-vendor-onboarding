/**
 * GET /api/artist/subscription/plans — pubblico
 * Proxy verso WP GET /plans
 */

import { NextRequest } from 'next/server';
import { apiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

const WP_BASE_URL = process.env.NEXT_PUBLIC_ARTPAY_SERVER_URL;

export async function GET(_request: NextRequest) {
  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/wp/v2/subscriptions/plans`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`WP plans fetch failed: ${res.status}`);

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Plans fetch error:', error);
    return apiError('Failed to fetch plans', 500);
  }
}