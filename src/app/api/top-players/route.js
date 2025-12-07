import { NextResponse } from 'next/server';
import { getTopPlayers } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const topPlayers = getTopPlayers(6);

    return NextResponse.json({
      success: true,
      data: topPlayers
    });
  } catch (error) {
    console.error('Error fetching top players:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch top players',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
