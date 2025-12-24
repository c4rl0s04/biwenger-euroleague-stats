import { NextResponse } from 'next/server';
import { getUserHomeAwayStats } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const stats = getUserHomeAwayStats(userId);
    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch home/away stats' }, { status: 500 });
  }
}
