import { NextResponse } from 'next/server';
import {
  fetchHeatCheckStats,
  fetchHunterStats,
  fetchRollingAverageStats,
  fetchFloorCeilingStats,
  fetchVolatilityStats,
  fetchPointDistributionStats,
  fetchAllPlayAllStats,
  fetchDominanceStats,
  fetchTheoreticalGapStats,
  fetchHeatmapStats,
} from '@/lib/services/standingsService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let data;

    switch (type) {
      case 'heat-check':
        data = fetchHeatCheckStats();
        break;
      case 'hunter':
        data = fetchHunterStats();
        break;
      case 'rolling-avg':
        data = fetchRollingAverageStats();
        break;
      case 'floor-ceiling':
        data = fetchFloorCeilingStats();
        break;
      case 'volatility':
        data = fetchVolatilityStats();
        break;
      case 'distribution':
        data = fetchPointDistributionStats();
        break;
      case 'all-play-all':
        data = fetchAllPlayAllStats();
        break;
      case 'dominance':
        data = fetchDominanceStats();
        break;
      case 'theoretical-gap':
        data = fetchTheoreticalGapStats();
        break;
      case 'heatmap':
        data = fetchHeatmapStats();
        break;
      default:
        return NextResponse.json({ error: 'Invalid stat type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(`Error fetching advanced stats (${request.url}):`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
