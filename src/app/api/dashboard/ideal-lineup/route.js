import { fetchLastRoundStats } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const players = await fetchLastRoundStats();

    if (!players || players.length === 0) {
      return successResponse(
        { lineup: [], total_points: 0, round_name: '-' },
        CACHE_DURATIONS.SHORT
      );
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

    return successResponse(
      {
        lineup,
        total_points: totalPoints,
        round_name: roundName,
      },
      CACHE_DURATIONS.MEDIUM
    );
  } catch (error) {
    console.error('Error fetching ideal lineup:', error);
    return errorResponse('Failed to fetch ideal lineup');
  }
}
