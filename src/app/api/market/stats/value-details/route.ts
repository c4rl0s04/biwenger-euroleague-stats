import { NextRequest } from 'next/server';
import { getBestValueDetails, parseMarketReadId } from '@/features/market/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferIdValidation = parseMarketReadId(searchParams.get('transferId'));

    if (!transferIdValidation.valid) {
      return errorResponse(transferIdValidation.error, 400);
    }

    const details = await getBestValueDetails(transferIdValidation.value);
    return privateJsonResponse({ success: true, data: details });
  } catch (error) {
    console.error('Error fetching best value details:', error);
    return errorResponse('Failed to fetch details');
  }
}
