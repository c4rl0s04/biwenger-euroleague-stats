import { NextRequest } from 'next/server';
import { getOfficialShots } from '@/lib/db/queries/competition/official-game-data';
import { errorResponse, successResponse } from '@/lib/utils/response';

function positiveInteger(value: string | null, name: string): number | undefined {
  if (value == null) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer.`);
  return parsed;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const matchId = positiveInteger((await params).id, 'Match ID');
    const period = positiveInteger(request.nextUrl.searchParams.get('period'), 'period');
    const playerId = positiveInteger(request.nextUrl.searchParams.get('playerId'), 'playerId');
    const teamCode = request.nextUrl.searchParams.get('teamCode')?.trim().toUpperCase();
    if (teamCode && !/^[A-Z0-9_-]{2,12}$/.test(teamCode)) {
      return errorResponse('Invalid teamCode.', 400);
    }
    const result = await getOfficialShots(matchId!, { period, playerId, teamCode });
    if (!result) return errorResponse('Match or official shots not found.', 404);
    return successResponse(result, result.finalizedAt ? 3600 : 15);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, /must be|Invalid/.test(message) ? 400 : 500);
  }
}
