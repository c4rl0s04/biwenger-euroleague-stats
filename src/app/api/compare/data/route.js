import { successResponse, errorResponse } from '@/lib/utils/response';
import { getComparisonData } from '@/lib/services/compareService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const data = await getComparisonData();
    return successResponse(data);
  } catch (error) {
    console.error('[API] /compare/data failed:', error);
    return errorResponse('Failed to fetch comparison data', 500);
  }
}
