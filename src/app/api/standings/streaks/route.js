import { NextResponse } from 'next/server';
import { getStreakStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const streaks = getStreakStats();
    return NextResponse.json({ success: true, data: streaks });
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
