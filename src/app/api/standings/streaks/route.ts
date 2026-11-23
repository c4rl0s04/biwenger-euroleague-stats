import { fetchStreakStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = await fetchStreakStats();
    return privateJsonResponse({ success: true, data: streaks });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return errorResponse('Internal Server Error');
  }
}
