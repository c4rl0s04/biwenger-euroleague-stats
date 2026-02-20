import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { getCompareData } from '@/lib/services';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const data = await getCompareData();
    return successResponse(data);
  } catch (error) {
    console.error('[API] /compare/data failed:', error);
    return errorResponse('Failed to fetch comparison data', 500);
  }
}
