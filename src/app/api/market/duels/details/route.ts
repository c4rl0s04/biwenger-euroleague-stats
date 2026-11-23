import { NextRequest } from 'next/server';
import { getBiddingDuelDetails, parseMarketDuelIds } from '@/features/market/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = parseMarketDuelIds(searchParams.get('userId'), searchParams.get('opponentId'));
    if (!ids.valid) return errorResponse(ids.error, 400);
    const details = await getBiddingDuelDetails(ids.value.userId, ids.value.opponentId);

    return privateJsonResponse({ success: true, data: details });
  } catch (error) {
    console.error('Error fetching bidding duel details:', error);
    return errorResponse('Failed to fetch duel details');
  }
}
