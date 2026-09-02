import { NextRequest } from 'next/server';
import {
  getTeamProfileData,
  TEAM_PROFILE_HTTP_CACHE_SECONDS,
  toTeamProfileApiModel,
} from '@/features/teams/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const team = await getTeamProfileData(id);

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    return successResponse({ team: toTeamProfileApiModel(team) }, TEAM_PROFILE_HTTP_CACHE_SECONDS);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return errorResponse('Failed to fetch team data');
  }
}
