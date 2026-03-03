import { NextRequest } from 'next/server';
import { getPlayerProfile } from '@/lib/services';
import { CACHE_DURATIONS, successResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Player ID is required', 400);
    }

    const stats = await getPlayerProfile(id);

    if (!stats) {
      return errorResponse('Player not found', 404);
    }

    // Return the full player profile which includes matches, historical performance, and next matches
    return successResponse(stats, CACHE_DURATIONS.MEDIUM);
  } catch (error) {
    console.error(`Error fetching player stats for ${params}:`, error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return errorResponse(message, 500);
  }
}
