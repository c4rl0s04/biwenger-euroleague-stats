import { NextResponse } from 'next/server';
import { fetchAllUsersPerformanceHistory } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

/**
 * GET /api/rounds/all-history
 * Returns performance history for all users (for heatmap)
 */
export async function GET() {
  try {
    const allUsersHistory = await fetchAllUsersPerformanceHistory();

    return successResponse({ allUsersHistory });
  } catch (error) {
    console.error('Error fetching all users history:', error);
    return errorResponse('Error fetching history data', 500);
  }
}
