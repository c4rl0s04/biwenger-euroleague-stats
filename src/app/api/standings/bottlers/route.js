import { NextResponse } from 'next/server';
import { getBottlerStats } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bottlers = getBottlerStats();
    return NextResponse.json({ success: true, data: bottlers });
  } catch (error) {
    console.error('Error fetching bottler stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
