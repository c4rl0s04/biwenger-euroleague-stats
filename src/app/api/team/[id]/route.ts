import { NextRequest } from 'next/server';
import { fetchTeamProfile } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const team = await fetchTeamProfile(id);

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    return successResponse({ team }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return errorResponse('Failed to fetch team data');
  }
}
