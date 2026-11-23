import { getPlayerStreaksApiData } from '@/features/players/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = await getPlayerStreaksApiData();
    return privateJsonResponse({ success: true, data: streaks });
  } catch (error) {
    console.error('Error fetching player streaks:', error);
    return errorResponse('Failed to fetch player streaks');
  }
}
