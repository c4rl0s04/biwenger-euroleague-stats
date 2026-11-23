import { fetchPlacementStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const placements = await fetchPlacementStats();
    return privateJsonResponse({ success: true, data: placements });
  } catch (error) {
    console.error('Error fetching placements:', error);
    return errorResponse('Internal Server Error');
  }
}
