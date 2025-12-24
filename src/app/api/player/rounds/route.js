import { NextResponse } from 'next/server';
import { getUserRecentRounds } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const rounds = getUserRecentRounds(userId, 10);
    return NextResponse.json({ success: true, rounds });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch rounds' }, { status: 500 });
  }
}
