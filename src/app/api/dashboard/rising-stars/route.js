import { NextResponse } from 'next/server';
import { getRisingStars } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stars = getRisingStars(5);

    return NextResponse.json({
      success: true,
      data: stars
    });
  } catch (error) {
    console.error('Error fetching rising stars:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rising stars',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
