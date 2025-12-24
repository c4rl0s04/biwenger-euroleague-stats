import { NextResponse } from 'next/server';
import { getStandings, getLastRoundWinner } from '@/lib/db';

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
    
    return NextResponse.json({ 
      success: true, 
      data: { standings, lastWinner } 
    });
  } catch (error) {
    console.error('Error fetching standings with winner:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
