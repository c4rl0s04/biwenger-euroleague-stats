import { fetchTopPlayers } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topPlayers = await fetchTopPlayers();
    return privateJsonResponse({ success: true, data: topPlayers });
  } catch (error) {
    console.error('Error fetching top players:', error);
    return errorResponse('Failed to fetch top players');
  }
}
