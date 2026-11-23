import { fetchLandingStats } from '@/features/home/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchLandingStats();
    return privateJsonResponse({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    return errorResponse('Failed to fetch landing stats', 500);
  }
}
