import { NextResponse } from 'next/server';
import { fetchMarketStats } from '@/lib/services/marketService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchMarketStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market stats' },
      { status: 500 }
    );
  }
}
