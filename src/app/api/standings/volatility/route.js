import { NextResponse } from 'next/server';
import { getVolatilityStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const volatility = getVolatilityStats();
    return NextResponse.json({ success: true, data: volatility });
  } catch (error) {
    console.error('Error fetching volatility:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
