import { NextResponse } from 'next/server';
import { getStandings, getLastRoundWinner } from '@/lib/db';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

/**
 * GET /api/standings-with-winner
 * Combined endpoint returning both standings and last round winner
 * Optimized for StandingsCard component
 */
export async function GET() {
  try {
    const standings = getStandings();
    const lastWinner = getLastRoundWinner();
    
    return successResponse({ standings, lastWinner }, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching standings with winner:', error);
    return errorResponse('Internal Server Error');
  }
}
