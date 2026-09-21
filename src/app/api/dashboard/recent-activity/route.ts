import { NextRequest } from 'next/server';
import { getRecentActivityData, parseActivityUserId } from '@/features/dashboard/server';
import {
  successResponse,
  privateJsonResponse,
  errorResponse,
  CACHE_DURATIONS,
} from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseActivityUserId(searchParams);
    if (!parsed.valid) return errorResponse('Invalid user ID format', 400);
    const userId = parsed.value;

    const data = await getRecentActivityData(userId);
    return userId !== null
      ? privateJsonResponse({ success: true, data })
      : successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return errorResponse('Failed to fetch recent activity');
  }
}
