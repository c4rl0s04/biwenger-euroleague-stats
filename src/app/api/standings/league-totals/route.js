import { NextResponse } from 'next/server';
import { getLeagueTotals } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const totals = getLeagueTotals();
    return NextResponse.json({ success: true, data: totals });
  } catch (error) {
    console.error('Error fetching league totals:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
