import { NextResponse } from 'next/server';
import { hoopgridService } from '@/lib/services/features/hoopgridService';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { challengeId, cellIndex, playerId, dryRun, action, guesses } = await request.json();

    // 1. Auth & User check
    const cookieStore = cookies();
    let userId = cookieStore.get('NEXT_USER_ID')?.value;

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
    }

    if (!userId) {
      const { db } = await import('@/lib/db');
      const fallbackUser = await db.query.users.findFirst();
      if (!fallbackUser) throw new Error('No users found in database for guest fallback.');
      userId = fallbackUser.id;
    }

    if (action === 'submitBatch') {
      const results = [];
      for (const [cellIdxStr, p] of Object.entries(guesses)) {
        if (!p.isCorrect) continue;
        const cellIdx = parseInt(cellIdxStr);
        const { isCorrect, guess } = await hoopgridService.submitGuess(
          challengeId,
          userId,
          cellIdx,
          p.playerId,
          false
        );
        const rarity = isCorrect
          ? await hoopgridService.getRarity(challengeId, cellIdx, p.playerId)
          : null;
        results.push({ cellIndex: cellIdx, isCorrect, guess, rarity });
      }
      return NextResponse.json({ success: true, results });
    }

    // 2. Submit guess via service (dryRun by default if specified)
    const { isCorrect, guess } = await hoopgridService.submitGuess(
      challengeId,
      userId,
      cellIndex,
      playerId,
      dryRun
    );

    // 3. If correct, fetch rarity score
    let rarity = null;
    if (isCorrect) {
      rarity = await hoopgridService.getRarity(challengeId, cellIndex, playerId);
    }

    return NextResponse.json({
      isCorrect,
      rarity,
      guess,
    });
  } catch (error: any) {
    console.error('Hoopgrid Guess Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
