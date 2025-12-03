import { NextResponse } from 'next/server';
import { getUserCaptainStats } from '@/lib/database';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    const stats = getUserCaptainStats(userId);
    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch captain stats' }, { status: 500 });
  }
}
