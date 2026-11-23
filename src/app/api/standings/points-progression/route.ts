import { NextRequest } from 'next/server';
import { fetchPointsProgression } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '10', 10) || 10;
    const progression = await fetchPointsProgression(limit);
    return privateJsonResponse({ success: true, data: progression });
  } catch (error) {
    console.error('Error fetching points progression:', error);
    return errorResponse('Internal Server Error');
  }
}
