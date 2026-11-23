import { NextRequest } from 'next/server';
import { getFullStandings, parseStandingsSearchParams } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standings = await getFullStandings(parseStandingsSearchParams(searchParams));
    return privateJsonResponse({ success: true, data: standings });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return errorResponse('Internal Server Error');
  }
}
