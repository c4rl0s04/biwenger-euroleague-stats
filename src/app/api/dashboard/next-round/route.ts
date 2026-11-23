import { fetchNextRound } from '@/features/dashboard/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const nextRound = await fetchNextRound();
    return privateJsonResponse({ success: true, data: { nextRound } });
  } catch (error) {
    console.error('Error fetching next round data:', error);
    return errorResponse('Failed to fetch next round data');
  }
}
