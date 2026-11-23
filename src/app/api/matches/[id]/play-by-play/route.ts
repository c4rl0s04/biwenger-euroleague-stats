import { NextRequest } from 'next/server';
import { getOfficialPlayByPlayData, MatchesInputError } from '@/features/matches/server';
import { errorResponse, privateJsonResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getOfficialPlayByPlayData({
      matchId: (await params).id,
      filters: {
        period: request.nextUrl.searchParams.get('period'),
        playerId: request.nextUrl.searchParams.get('playerId'),
        teamCode: request.nextUrl.searchParams.get('teamCode'),
      },
    });
    if (!result.data) return errorResponse('Match or official play-by-play not found.', 404);
    return privateJsonResponse({ success: true, data: result.data });
  } catch (error) {
    if (error instanceof MatchesInputError) return errorResponse(error.message, 400);
    return errorResponse('Internal Server Error', 500);
  }
}
