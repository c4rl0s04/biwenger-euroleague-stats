import { NextRequest } from 'next/server';
import { fetchBestValueDetails } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferIdValidation = validateNumber(searchParams.get('transferId'), {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    });

    if (!transferIdValidation.valid) {
      return errorResponse(transferIdValidation.error, 400);
    }

    const details = await fetchBestValueDetails(transferIdValidation.value);
    return successResponse(details, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error('Error fetching best value details:', error);
    return errorResponse('Failed to fetch details');
  }
}
