import { NextResponse } from 'next/server';
import { 
  getNextRound, 
  getTopPlayersByForm, 
  getCaptainRecommendations, 
  getMarketOpportunities 
} from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // Get next round information
    const nextRound = getNextRound();
    
    // Get top players by recent form
    const topPlayersForm = getTopPlayersByForm(5, 3);
    
    // Get captain recommendations if userId is provided
    const captainRecommendations = userId 
      ? getCaptainRecommendations(userId, 3)
      : [];
    
    // Get market opportunities
    const marketOpportunities = getMarketOpportunities(3);

    return NextResponse.json({
      success: true,
      data: {
        nextRound,
        topPlayersForm,
        captainRecommendations,
        marketOpportunities
      }
    });
  } catch (error) {
    console.error('Error fetching next round data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch next round data',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
