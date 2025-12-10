import { NextResponse } from 'next/server';
import { getLastRoundStats } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const players = getLastRoundStats();
    
    if (!players || players.length === 0) {
        return NextResponse.json({ success: true, data: { lineup: [], total_points: 0, round_name: '-' } });
    }

    const roundName = players[0].round_name;
    
    // Logic to select top 5 players with max 3 per position
    const lineup = [];
    const positionCounts = {};
    let totalPoints = 0;

    for (const player of players) {
      if (lineup.length >= 5) break;

      const pos = player.position;
      const currentCount = positionCounts[pos] || 0;

      if (currentCount < 3) {
        // Construct image URL (Biwenger standard)
        player.img = `https://cdn.biwenger.com/players/euroleague/${player.player_id}.png`;
        
        lineup.push(player);
        positionCounts[pos] = currentCount + 1;
        totalPoints += player.points;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        lineup,
        total_points: totalPoints,
        round_name: roundName
      }
    });
  } catch (error) {
    console.error('Error fetching ideal lineup:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch ideal lineup',
        message: error.message 
      },
      { status: 500 }
    );
  }
}