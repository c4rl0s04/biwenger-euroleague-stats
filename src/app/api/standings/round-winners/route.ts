import { NextRequest } from 'next/server';
import { fetchRoundWinners } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? parseInt(limitRaw, 10) : 15;
    const winners = await fetchRoundWinners(limit);
    return privateJsonResponse({ success: true, data: winners });
  } catch (error) {
    console.error('Error fetching round winners:', error);
    return errorResponse('Internal Server Error');
  }
}
