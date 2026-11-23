import { NextRequest } from 'next/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';
import { getCompareData } from '@/features/compare/server';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const data = await getCompareData();
    return privateJsonResponse({ success: true, data });
  } catch {
    console.error('[API] /compare/data failed:');
    return errorResponse('Failed to fetch comparison data', 500);
  }
}
