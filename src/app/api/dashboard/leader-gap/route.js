import { NextResponse } from 'next/server';
import { getLeaderComparison } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const data = getLeaderComparison(userId);
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leader comparison' }, { status: 500 });
  }
}
