import { NextResponse } from 'next/server';
import { getStandings, getNextRound } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get User Count
    const standings = getStandings();
    const userCount = standings.length;

    // 2. Get Current Round & Playoff Calc
    const nextRound = getNextRound();
    let roundNumber = 0;

    if (nextRound && nextRound.round_name) {
      // Extract number from "Jornada 18"
      const match = nextRound.round_name.match(/\d+/);
      if (match) {
        roundNumber = parseInt(match[0], 10);
      }
    }

    // Euroleague typically has 34 rounds before playoffs, but user confirmed 38
    const PLAYOFF_START_ROUND = 39;
    let weeksToPlayoffs = 0;

    if (roundNumber > 0) {
      weeksToPlayoffs = Math.max(0, PLAYOFF_START_ROUND - roundNumber);
    }

    return NextResponse.json({
      userCount,
      currentRound: nextRound?.round_name || 'Pre-Season',
      weeksToPlayoffs,
      playoffStartRound: PLAYOFF_START_ROUND,
    });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch landing stats' }, { status: 500 });
  }
}
