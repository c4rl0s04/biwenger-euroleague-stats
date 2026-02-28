import { NextRequest } from 'next/server';
import { getPlayerPerformanceSummary } from '@/lib/services';
import { CACHE_DURATIONS, successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Player ID is required', 400);
    }

    const stats = await getPlayerPerformanceSummary(id);

    if (!stats) {
      return errorResponse('Player not found', 404);
    }

    // Map camelCase to snake_case for the frontend modal
    return successResponse({
      ...stats,
      total_points: stats.totalPoints,
      games_played: stats.gamesPlayed,
    }, CACHE_DURATIONS.MEDIUM);

  } catch (error) {
    console.error(`Error fetching player stats for ${params}:`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, 500);
  }
}
