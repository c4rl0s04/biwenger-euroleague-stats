import { NextResponse } from 'next/server';
import { fetchRoundLeaderboard } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/rounds/leaderboard
 * Returns aggregated performance stats for all users
 */
export async function GET() {
  try {
    // Unified Service Call
    const leaderboardData = await fetchRoundLeaderboard();

    // Sort by efficiency by default

    return successResponse({ leaderboard: leaderboardData });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return errorResponse('Error fetching leaderboard data', 500);
  }
}
