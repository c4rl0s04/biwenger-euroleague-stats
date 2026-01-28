import { NextResponse } from 'next/server';
import { getUserPerformanceHistoryService } from '@/lib/services/roundsService';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { db } from '@/lib/db/client';

/**
 * GET /api/rounds/all-history
 * Returns performance history for all users (for heatmap)
 */
export async function GET() {
  try {
    // Get all users
    const usersQuery = await db.query('SELECT id, name FROM users ORDER BY name');
    const users = usersQuery.rows;

    if (!users || users.length === 0) {
      return successResponse({ allUsersHistory: [] });
    }

    // Fetch history for each user
    const allUsersHistory = await Promise.all(
      users.map(async (user) => {
        try {
          const history = await getUserPerformanceHistoryService(user.id);
          return {
            userId: user.id,
            history: history || [],
          };
        } catch (err) {
          console.error(`Error fetching history for user ${user.id}:`, err);
          return {
            userId: user.id,
            history: [],
          };
        }
      })
    );

    return successResponse({ allUsersHistory });
  } catch (error) {
    console.error('Error fetching all users history:', error);
    return errorResponse('Error fetching history data', 500);
  }
}
