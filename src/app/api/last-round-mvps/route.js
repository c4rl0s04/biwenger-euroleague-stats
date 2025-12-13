import { NextResponse } from 'next/server';
import { getLastRoundMVPs } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mvps = getLastRoundMVPs(5);

    return NextResponse.json({
      success: true,
      data: mvps
    });
  } catch (error) {
    console.error('Error fetching last round MVPs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch MVPs',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
