import { NextResponse } from 'next/server';
import { getLeagueComparisonStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const comparison = getLeagueComparisonStats();
    return NextResponse.json({ success: true, data: comparison });
  } catch (error) {
    console.error('Error fetching league comparison:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
