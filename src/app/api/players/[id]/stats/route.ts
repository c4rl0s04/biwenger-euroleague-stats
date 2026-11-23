import { NextRequest } from 'next/server';
import { getPlayerProfileApiData } from '@/features/players/server';
import { privateJsonResponse, errorResponse } from '@/lib/utils/response';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return errorResponse('Player ID is required', 400);
    }

    const stats = await getPlayerProfileApiData(id);

    if (!stats) {
      return errorResponse('Player not found', 404);
    }

    // Return the full player profile which includes matches, historical performance, and next matches
    return privateJsonResponse({ success: true, data: stats });
  } catch (error) {
    console.error(`Error fetching player stats for ${params}:`, error);
    return errorResponse('Internal Server Error', 500);
  }
}
