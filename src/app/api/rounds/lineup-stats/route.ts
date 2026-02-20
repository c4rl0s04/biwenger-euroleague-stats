import { NextResponse } from 'next/server';
import { fetchLineupStats } from '@/lib/services/core/roundsService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await fetchLineupStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching lineup stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lineup stats' },
      { status: 500 }
    );
  }
}
