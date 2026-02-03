import {
  getRoundGlobalStats,
  getIdealLineup,
  getUserOptimization,
  getPlayersLeftOut,
  getCoachRating,
} from '@/lib/db';
import { fetchRoundCompleteData } from '@/lib/services'; // Import aggregator
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roundId = searchParams.get('roundId');
    const userId = searchParams.get('userId');
    const mode = searchParams.get('mode'); // Check for mode=full

    if (!roundId) return errorResponse('Missing roundId');

    // NEW: Full Mode (One-Shot Fetch for Rounds Page)
    if (mode === 'full') {
      const fullData = await fetchRoundCompleteData(roundId);
      return successResponse(fullData, CACHE_DURATIONS.MEDIUM);
    }

    // LEGACY: Specific User fetch (Keep for now or if light fetch needed)
    const [globalStats, idealLineup, userStats, leftOut, coachRating] = await Promise.all([
      getRoundGlobalStats(roundId),
      getIdealLineup(roundId),
      userId ? getUserOptimization(userId, roundId) : null,
      userId ? getPlayersLeftOut(userId, roundId) : [],
      userId ? getCoachRating(userId, roundId) : null,
    ]);

    return successResponse(
      {
        global: globalStats,
        idealLineup,
        user: {
          ...userStats,
          coachRating, // { rating, maxScore, diff }
          idealLineup: coachRating?.idealLineup, // Flatten structure for UI
          leftOut, // List of players
        },
      },
      CACHE_DURATIONS.MEDIUM
    );
  } catch (error) {
    console.error('Error fetching round stats:', error);
    return errorResponse('Failed to fetch round stats');
  }
}
