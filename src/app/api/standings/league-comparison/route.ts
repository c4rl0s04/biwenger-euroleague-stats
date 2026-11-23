import { fetchLeagueComparisonStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const comparison = await fetchLeagueComparisonStats();
    return privateJsonResponse({ success: true, data: comparison });
  } catch (error) {
    console.error('Error fetching league comparison:', error);
    return errorResponse('Internal Server Error');
  }
}
