import { NextResponse } from 'next/server';
import { getExtendedStandings } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = getExtendedStandings();
    return NextResponse.json({ success: true, data: standings });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
