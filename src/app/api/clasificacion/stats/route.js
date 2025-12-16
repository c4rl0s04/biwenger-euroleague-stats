import { NextResponse } from 'next/server';
import { getExtendedStandings, getLeagueTotals } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const standings = getExtendedStandings();
    const totals = getLeagueTotals();
    
    return NextResponse.json({ 
      success: true, 
      data: { standings, totals } 
    });
  } catch (error) {
    console.error('Error fetching clasificacion stats:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
