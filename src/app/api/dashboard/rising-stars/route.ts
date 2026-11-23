import { fetchRisingStars } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stars = await fetchRisingStars();
    return privateJsonResponse({ success: true, data: stars });
  } catch (error) {
    console.error('Error fetching rising stars:', error);
    return errorResponse('Failed to fetch rising stars');
  }
}
