import { NextResponse } from 'next/server';
import { getLeagueAveragePoints } from '@/lib/database';

export async function GET() {
  try {
    const average = getLeagueAveragePoints();
    return NextResponse.json({ success: true, average });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch league average' }, { status: 500 });
  }
}
