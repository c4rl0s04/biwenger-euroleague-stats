import { NextResponse } from 'next/server';
import { getLastRoundWinner } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const winner = getLastRoundWinner();
    return NextResponse.json({ success: true, data: winner });
  } catch (error) {
    console.error('Error fetching last round winner:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
