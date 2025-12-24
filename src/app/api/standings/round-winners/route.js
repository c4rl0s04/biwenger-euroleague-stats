import { NextResponse } from 'next/server';
import { getRoundWinners } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const winners = getRoundWinners(15);
    return NextResponse.json({ success: true, data: winners });
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
