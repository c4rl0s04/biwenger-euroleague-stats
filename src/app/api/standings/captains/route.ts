import { NextRequest } from 'next/server';
import { fetchDetailedCaptainStats } from '@/features/standings/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest) {
  try {
    const stats = await fetchDetailedCaptainStats();
    return privateJsonResponse({ success: true, data: { stats } });
  } catch (error) {
    console.error('API Error in /api/standings/captains:', error);
    return errorResponse('Failed to fetch detailed captain stats');
  }
}
