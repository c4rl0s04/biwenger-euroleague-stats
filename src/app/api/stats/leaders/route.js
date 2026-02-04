import { NextResponse } from 'next/server';
import { fetchStatLeaders } from '@/lib/services';

export async function GET(request) {
  try {
    // 1. Get the "type" from the URL (e.g., ?type=rebounds)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'points';

    // 2. Fetch data from Service
    const data = await fetchStatLeaders(type);

    // 3. Return JSON with success wrapper
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch leaders' }, { status: 500 });
  }
}
