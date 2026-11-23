export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchNewsFeed } from '@/features/news/server';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const news = await fetchNewsFeed();
    return successResponse(news);
  } catch (error) {
    console.error('News API Error:', error);
    return errorResponse('Internal Server Error', 500);
  }
}
