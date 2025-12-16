import { NextResponse } from 'next/server';
import { getPointsProgression, getValueRanking } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const progression = getPointsProgression(10);
    const valueRanking = getValueRanking();
    
    return NextResponse.json({ 
      success: true, 
      data: { progression, valueRanking } 
    });
  } catch (error) {
    console.error('Error fetching progression:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
