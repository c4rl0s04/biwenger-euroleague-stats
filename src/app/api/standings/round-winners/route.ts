import { NextRequest } from 'next/server';
import { fetchRoundWinners } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 15;
    const winners = await fetchRoundWinners(limit);
    return successResponse(winners, CACHE_DURATIONS.LONG);
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return errorResponse('Internal Server Error');
  }
}
