import { fetchLandingStats } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchLandingStats();
    return successResponse(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch landing stats';
    console.error('Error fetching landing stats:', error);
    return errorResponse(message, 500);
  }
}
