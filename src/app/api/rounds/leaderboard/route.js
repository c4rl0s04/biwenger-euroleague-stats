import { NextResponse } from 'next/server';
import { getUserPerformanceHistoryService } from '@/lib/services';
import { calculateStats } from '@/lib/hooks/usePerformanceStats';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db/client';

/**
 * GET /api/rounds/leaderboard
 * Returns aggregated performance stats for all users
 */
export async function GET() {
  try {
    // Get all users
    const usersQuery = await db.query('SELECT id, name FROM users ORDER BY name');
    const users = usersQuery.rows;

    if (!users || users.length === 0) {
      return successResponse({ leaderboard: [] });
    }

    // Fetch history for each user and calculate stats
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        try {
          const history = await getUserPerformanceHistoryService(user.id);
          const stats = calculateStats(history);

          if (!stats) {
            return {
              userId: user.id,
              avgEfficiency: '0.0',
              totalLost: 0,
              bestActual: 0,
              worstActual: 0,
              bestEfficiency: 0,
              bestEffRound: null,
              worstEfficiency: 0,
              worstEffRound: null,
              roundsPlayed: 0,
            };
          }

          return {
            userId: user.id,
            avgEfficiency: stats.avgEfficiency,
            totalLost: stats.totalLost,
            bestActual: stats.bestRound?.actual_points || 0,
            worstActual: stats.worstRound?.actual_points || 0,
            bestEfficiency: stats.bestEffRound?.efficiency || 0,
            bestEffRound: stats.bestEffRound?.round_number || null,
            worstEfficiency: stats.worstEffRound?.efficiency || 0,
            worstEffRound: stats.worstEffRound?.round_number || null,
            roundsPlayed: stats.roundsPlayed,
          };
        } catch (err) {
          console.error(`Error fetching stats for user ${user.id}:`, err);
          return {
            userId: user.id,
            avgEfficiency: '0.0',
            totalLost: 0,
            bestActual: 0,
            worstActual: 0,
            bestEfficiency: 0,
            bestEffRound: null,
            worstEfficiency: 0,
            worstEffRound: null,
            roundsPlayed: 0,
          };
        }
      })
    );

    // Sort by efficiency by default
    leaderboardData.sort((a, b) => parseFloat(b.avgEfficiency) - parseFloat(a.avgEfficiency));

    return successResponse({ leaderboard: leaderboardData });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return errorResponse('Error fetching leaderboard data', 500);
  }
}
