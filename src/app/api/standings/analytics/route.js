import { NextResponse } from 'next/server';
import { getInitialSquadActualPerformance } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const analytics = getInitialSquadActualPerformance();
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
