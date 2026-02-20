import { NextRequest } from 'next/server';
import { getRecentActivityData } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');

    let userId: string | null = null;
    if (userIdParam) {
      const validation = validateNumber(userIdParam, { min: 1, max: 999999999 });
      if (!validation.valid) {
        return errorResponse('Invalid user ID format', 400);
      }
      userId = String(validation.value);
    }

    const data = await getRecentActivityData(userId);
    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return errorResponse('Failed to fetch recent activity');
  }
}
