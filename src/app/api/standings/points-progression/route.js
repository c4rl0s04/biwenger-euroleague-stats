import { fetchPointsProgression } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const progression = fetchPointsProgression(50);
    return successResponse(progression, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching points progression:', error);
    return errorResponse('Internal Server Error');
  }
}
