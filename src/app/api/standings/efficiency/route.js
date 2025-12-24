import { NextResponse } from 'next/server';
import { getEfficiencyStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const efficiency = getEfficiencyStats();
    return NextResponse.json({ success: true, data: efficiency });
  } catch (error) {
    console.error('Error fetching efficiency stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
