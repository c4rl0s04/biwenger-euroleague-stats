import { NextResponse } from 'next/server';
import { 
  getVolatilityStats,
  getPlacementStats,
  getLeagueComparisonStats,
  getEfficiencyStats,
  getStreakStats,
  getBottlerStats,
  getHeartbreakerStats,
  getNoGloryStats,
  getJinxStats
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const volatility = getVolatilityStats();
    const placements = getPlacementStats();
    const leagueComparison = getLeagueComparisonStats();
    const efficiency = getEfficiencyStats();
    const streaks = getStreakStats();
    const bottlers = getBottlerStats();
    const heartbreakers = getHeartbreakerStats();
    const noGlory = getNoGloryStats();
    const jinx = getJinxStats();
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        volatility,
        placements,
        leagueComparison,
        efficiency,
        streaks,
        bottlers,
        heartbreakers,
        noGlory,
        jinx
      } 
    });
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
