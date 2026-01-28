import { NextResponse } from 'next/server';
import { getUserPerformanceHistory } from '@/lib/db/queries/rounds';

/**
 * GET /api/rounds/history?userId=X
 * Returns user's performance history across all finished rounds
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const history = await getUserPerformanceHistory(userId);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
