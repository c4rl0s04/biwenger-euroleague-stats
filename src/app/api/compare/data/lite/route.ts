import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { getCompareDataLite } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const data = await getCompareDataLite();
    return successResponse(data);
  } catch (error) {
    console.error('[API] /compare/data/lite failed:', error);
    return errorResponse('Failed to fetch comparison data', 500);
  }
}
