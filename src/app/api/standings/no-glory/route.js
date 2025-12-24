import { NextResponse } from 'next/server';
import { getNoGloryStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const noGlory = getNoGloryStats();
    return NextResponse.json({ success: true, data: noGlory });
  } catch (error) {
    console.error('Error fetching no glory stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
