import { NextResponse } from 'next/server';
import { getPlacementStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const placements = getPlacementStats();
    return NextResponse.json({ success: true, data: placements });
  } catch (error) {
    console.error('Error fetching placements:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
