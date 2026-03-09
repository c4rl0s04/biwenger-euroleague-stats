import { NextRequest } from 'next/server';
import { fetchBiddingDuelDetails } from '@/lib/services';
import { successResponse, errorResponse, CACHE_DURATIONS } from '@/lib/utils/response';
import { validateNumber } from '@/lib/utils/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdValidation = validateNumber(searchParams.get('userId'), {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    });
    const opponentIdValidation = validateNumber(searchParams.get('opponentId'), {
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    });

    if (!userIdValidation.valid) {
      return errorResponse(userIdValidation.error, 400);
    }

    if (!opponentIdValidation.valid) {
      return errorResponse(opponentIdValidation.error, 400);
    }

    if (userIdValidation.value === opponentIdValidation.value) {
      return errorResponse('Users must be different', 400);
    }

    const details = await fetchBiddingDuelDetails(
      userIdValidation.value,
      opponentIdValidation.value
    );

    return successResponse(details, CACHE_DURATIONS.SHORT);
  } catch (error) {
    console.error('Error fetching bidding duel details:', error);
    return errorResponse('Failed to fetch duel details');
  }
}
