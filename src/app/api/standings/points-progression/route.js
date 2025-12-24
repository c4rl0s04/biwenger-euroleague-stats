import { NextResponse } from 'next/server';
import { getPointsProgression } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const progression = getPointsProgression(38);
    return NextResponse.json({ success: true, data: progression });
  } catch (error) {
    console.error('Error fetching points progression:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
