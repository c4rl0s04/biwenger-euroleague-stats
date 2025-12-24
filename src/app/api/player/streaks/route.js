import { NextResponse } from 'next/server';
import { getPlayerStreaks } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = getPlayerStreaks(3);

    return NextResponse.json({
      success: true,
      data: streaks
    });
  } catch (error) {
    console.error('Error fetching player streaks:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch player streaks',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
