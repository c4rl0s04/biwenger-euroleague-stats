export const dynamic = 'force-dynamic'; // Always fetch fresh data

import { NextResponse } from 'next/server';
import { fetchNewsFeed } from '@/lib/services';

export async function GET() {
  try {
    const news = await fetchNewsFeed();
    return NextResponse.json(news);
  } catch (error) {
    console.error('News API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
