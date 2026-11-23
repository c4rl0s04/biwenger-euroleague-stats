import { NextRequest } from 'next/server';
import { readRoundHttpInput } from '@/features/rounds/server';
import { fetchUserLineup } from '@/features/rounds/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { userId, roundId } = readRoundHttpInput(searchParams);

    if (!userId || !roundId) {
      return errorResponse('Missing userId or roundId', 400);
    }

    const lineup = await fetchUserLineup(userId, roundId);
    return privateJsonResponse({ success: true, data: lineup });
  } catch (error) {
    console.error('Error fetching user lineup:', error);
    return errorResponse('Failed to fetch user lineup');
  }
}
