import { NextResponse } from 'next/server';
import { getValueRanking } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const valueRanking = getValueRanking();
    return NextResponse.json({ success: true, data: valueRanking });
  } catch (error) {
    console.error('Error fetching value ranking:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
