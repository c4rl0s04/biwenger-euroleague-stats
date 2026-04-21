import { NextResponse } from 'next/server';
import { HoopgridService, hoopgridService } from '@/lib/services/features/hoopgridService';
import { db } from '@/lib/db';
import { hoopgridGuesses, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // 1. Get target date from query or default to today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];

    let challenge = await db.query.hoopgridChallenges.findFirst({
      where: (ch, { eq, and }) => and(eq(ch.gameDate, targetDate), eq(ch.isActive, true)),
    });

    // Lazy Generation: If no challenge exists for today, the first user to visit triggers its creation
    if (!challenge) {
      // 20% chance of generating a very hard challenge if auto-generating
      const minComplexity = Math.random() < 0.2 ? 75 : 0;
      challenge = await hoopgridService.generateDailyChallenge(targetDate, minComplexity);
    }

    // 2. Get user from cookie or session fallback
    const cookieStore = await cookies();
    let userId = cookieStore.get('NEXT_USER_ID')?.value;

    if (!userId) {
      const session = await auth();
      userId = session?.user?.id;
    }

    if (!userId) {
      const fallbackUser = await db.query.users.findFirst();
      userId = fallbackUser?.id;
    }

    let userGuesses: any[] = [];
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
          rarity: g.playerId
            ? await HoopgridService.getRarity(challenge!.id, g.cellIndex, g.playerId)
            : 0,
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
        complexity: HoopgridService.calculateComplexity(challenge.possibleCounts),
      },
      userGuesses,
    });
  } catch (error: any) {
    console.error('Hoopgrid Today Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
