import { NextRequest } from 'next/server';
import { fetchLiveMarketTransfers } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageValidation = validateNumber(searchParams.get('page'), {
      defaultValue: 1,
      min: 1,
      max: 1000,
    });
    const limitValidation = validateNumber(searchParams.get('limit'), {
      defaultValue: 10,
      min: 1,
      max: 100,
    });

    if (!pageValidation.valid) {
      return errorResponse(pageValidation.error, 400);
    }

    if (!limitValidation.valid) {
      return errorResponse(limitValidation.error, 400);
    }

    const buyer = searchParams.get('buyer')?.trim() || undefined;
    const seller = searchParams.get('seller')?.trim() || undefined;

    const data = await fetchLiveMarketTransfers({
      page: pageValidation.value,
      limit: limitValidation.value,
      buyer,
      seller,
    });

    return successResponse(data, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching market transfers:', error);
    return errorResponse('Failed to fetch transfers');
  }
}
