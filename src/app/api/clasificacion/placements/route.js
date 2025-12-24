import { NextResponse } from 'next/server';
import { getPlacementStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getPlacementStats();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching placement stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
