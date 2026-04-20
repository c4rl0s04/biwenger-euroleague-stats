import { NextResponse } from 'next/server';
import { hoopgridService } from '@/lib/services/features/hoopgridService';
import { db } from '@/lib/db';
import { hoopgridGuesses, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // 1. Get today's challenge
    const today = new Date().toISOString().split('T')[0];
    let challenge = await db.query.hoopgridChallenges.findFirst({
      where: (ch, { eq, and }) => and(eq(ch.gameDate, today), eq(ch.isActive, true)),
    });

    // Lazy Generation: If no challenge exists for today, the first user to visit triggers its creation
    if (!challenge) {
      challenge = await hoopgridService.generateDailyChallenge(today);
    }

    // 2. Get user from cookie or session fallback
    const cookieStore = cookies();
    let userId = cookieStore.get('NEXT_USER_ID')?.value;

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
    }

    if (!userId) {
      const fallbackUser = await db.query.users.findFirst();
      userId = fallbackUser?.id;
    }

    let userGuesses = [];
    if (userId) {
      const rawGuesses = await db
        .select({
          cellIndex: hoopgridGuesses.cellIndex,
          playerId: hoopgridGuesses.playerId,
          isCorrect: hoopgridGuesses.isCorrect,
          playerName: players.name,
          playerImg: players.img,
        })
        .from(hoopgridGuesses)
        .leftJoin(players, eq(hoopgridGuesses.playerId, players.id))
        .where(
          and(eq(hoopgridGuesses.challengeId, challenge.id), eq(hoopgridGuesses.userId, userId))
        );

      // Attach rarity to each guess
      userGuesses = await Promise.all(
        rawGuesses.map(async (g) => ({
          ...g,
          rarity: await hoopgridService.getRarity(challenge.id, g.cellIndex, g.playerId),
        }))
      );
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        rows:
          typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [],
        cols:
          typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [],
        possibleCounts:
          typeof challenge.possibleCounts === 'string'
            ? JSON.parse(challenge.possibleCounts)
            : challenge.possibleCounts || [],
      },
      userGuesses,
    });
  } catch (error: any) {
    console.error('Hoopgrid Today Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
