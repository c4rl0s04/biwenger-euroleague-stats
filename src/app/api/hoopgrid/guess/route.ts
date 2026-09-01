import { hoopgridService } from '@/lib/services/features/hoopgridService';
import { auth } from '@/auth';
import { privateJsonResponse } from '@/lib/utils/response';

export async function POST(request: Request) {
  try {
    const { challengeId, cellIndex, playerId, dryRun, action, guesses } = await request.json();

    // 1. Auth & User check (Strict Session)
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return privateJsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (action === 'submitBatch') {
      const results: any[] = [];
      const batchGuesses = guesses as Record<string, { playerId: number; isCorrect: boolean }>;

      for (const [cellIdxStr, p] of Object.entries(batchGuesses)) {
        if (!p.isCorrect) continue;
        const cellIdx = parseInt(cellIdxStr);
        const res = await hoopgridService.submitGuess(
          challengeId,
          userId,
          cellIdx,
          p.playerId,
          false
        );
        results.push({ cellIndex: cellIdx, ...res });
      }
      return privateJsonResponse({ success: true, results });
    }

    // 2. Submit guess via service
    const result = await hoopgridService.submitGuess(
      challengeId,
      userId,
      cellIndex,
      playerId,
      dryRun
    );

    return privateJsonResponse(result);
  } catch (error: any) {
    console.error('Hoopgrid Guess Error:', error);
    return privateJsonResponse({ error: error.message }, 500);
  }
}
