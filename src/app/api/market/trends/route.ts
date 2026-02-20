import { NextRequest, NextResponse } from 'next/server';
import { getMarketTrendsAnalysis } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    const allowedDays = [7, 30, 90, 180, 365];
    if (!allowedDays.includes(days)) {
      return NextResponse.json({ error: 'Invalid days parameter' }, { status: 400 });
    }

    const data = await getMarketTrendsAnalysis(days);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching market trends:', error);
    return NextResponse.json({ error: 'Failed to fetch market trends' }, { status: 500 });
  }
}
