export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { fetchNewsFeed } from '@/lib/services';
import { successResponse, errorResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const news = await fetchNewsFeed();
    return successResponse(news);
  } catch (error) {
    console.error('News API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, 500);
  }
}
