import { NextRequest } from 'next/server';
import { getTeamProfileData, toTeamProfileApiModel } from '@/features/teams/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const team = await getTeamProfileData(id);

    if (!team) {
      return errorResponse('Team not found', 404);
    }

    return privateJsonResponse({ success: true, data: { team: toTeamProfileApiModel(team) } });
  } catch (error) {
    console.error('Error fetching team data:', error);
    return errorResponse('Failed to fetch team data');
  }
}
