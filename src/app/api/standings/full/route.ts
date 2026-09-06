import { NextRequest } from 'next/server';
import {
  getFullStandings,
  parseStandingsSearchParams,
  STANDINGS_CACHE_POLICY,
} from '@/features/standings/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standings = await getFullStandings(parseStandingsSearchParams(searchParams));
    return successResponse(standings, STANDINGS_CACHE_POLICY.fullHttpSeconds);
  } catch (error) {
    console.error('Error fetching standings:', error);
    return errorResponse('Internal Server Error');
  }
}
