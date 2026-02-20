import { NextRequest } from 'next/server';
import { getFullStandings } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') ?? 'total_points';
    const dirRaw = searchParams.get('dir') ?? 'desc';
    const direction = (dirRaw === 'asc' || dirRaw === 'desc' ? dirRaw : 'desc') as 'asc' | 'desc';

    const standings = await getFullStandings({ sortBy, direction });
    return successResponse(standings, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return errorResponse('Internal Server Error');
  }
}
