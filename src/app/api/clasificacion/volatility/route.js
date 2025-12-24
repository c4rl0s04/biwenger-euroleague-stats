import { NextResponse } from 'next/server';
import { getVolatilityStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getVolatilityStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching volatility stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
