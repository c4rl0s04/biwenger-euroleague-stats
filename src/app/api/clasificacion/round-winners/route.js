import { NextResponse } from 'next/server';
import { getRoundWinners, getWinCounts } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const winners = getRoundWinners(15);
    const winCounts = getWinCounts();
    
    return NextResponse.json({ 
      success: true, 
      data: { winners, winCounts } 
    });
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
