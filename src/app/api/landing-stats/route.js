import { NextResponse } from 'next/server';
import { fetchLandingStats } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchLandingStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    return NextResponse.json({ error: 'Failed to fetch landing stats' }, { status: 500 });
  }
}
