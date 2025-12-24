import { NextResponse } from 'next/server';
import { getLeagueComparisonStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getLeagueComparisonStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching league comparison stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
