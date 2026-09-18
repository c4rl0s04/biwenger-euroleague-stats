import { NextRequest } from 'next/server';
import { getLiveMarketTransfers, parseMarketTransferParams } from '@/features/market/server';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = parseMarketTransferParams(searchParams);
    if (!input.valid) return errorResponse(input.error, 400);
    const data = await getLiveMarketTransfers(input.value);

    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching market transfers:', error);
    return errorResponse('Failed to fetch transfers');
  }
}
