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
  fetchPositionChangesStats,
  fetchReliabilityStats,
  fetchRivalryMatrixStats,
} from '@/lib/services';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let data;

    switch (type) {
      case 'heat-check':
        data = await fetchHeatCheckStats();
        break;
      case 'hunter':
        data = await fetchHunterStats();
        break;
      case 'rolling-avg':
        data = await fetchRollingAverageStats();
        break;
      case 'floor-ceiling':
        data = await fetchFloorCeilingStats();
        break;
      case 'volatility':
        data = await fetchVolatilityStats();
        break;
      case 'distribution':
        data = await fetchPointDistributionStats();
        break;
      case 'all-play-all':
        data = await fetchAllPlayAllStats();
        break;
      case 'dominance':
        data = await fetchDominanceStats();
        break;
      case 'theoretical-gap':
        data = await fetchTheoreticalGapStats();
        break;
      case 'heatmap':
        data = await fetchHeatmapStats();
        break;
      case 'position-evolution':
        data = await fetchPositionChangesStats();
        break;
      case 'reliability':
        data = await fetchReliabilityStats();
        break;
      case 'rivalry-matrix':
        data = await fetchRivalryMatrixStats();
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
