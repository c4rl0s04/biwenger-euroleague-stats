import { NextRequest, NextResponse } from 'next/server';
import { fetchStatLeaders } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') ?? 'points';
    const data = await fetchStatLeaders(type);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaders' }, { status: 500 });
  }
}
