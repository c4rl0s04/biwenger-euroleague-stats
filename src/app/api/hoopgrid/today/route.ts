import { NextResponse } from 'next/server';
import { hoopgridService } from '@/lib/services/features/hoopgridService';
import { db } from '@/lib/db';
import { hoopgridGuesses, players } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

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

    // 2. Get user session
    const session = await auth();

    let userGuesses = [];
    if (session?.user) {
      userGuesses = await db
        .select({
          cellIndex: hoopgridGuesses.cellIndex,
          playerId: hoopgridGuesses.playerId,
          isCorrect: hoopgridGuesses.isCorrect,
          playerName: players.name,
          playerImg: players.img,
        })
        .from(hoopgridGuesses)
        .leftJoin(players, eq(hoopgridGuesses.playerId, players.id))
        .where(eq(hoopgridGuesses.challengeId, challenge.id))
        .where(eq(hoopgridGuesses.userId, session.user.id || '1')); // Default to '1' as per your auth config
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        rows:
          typeof challenge.rows === 'string' ? JSON.parse(challenge.rows) : challenge.rows || [],
        cols:
          typeof challenge.cols === 'string' ? JSON.parse(challenge.cols) : challenge.cols || [],
      },
      userGuesses,
    });
  } catch (error: any) {
    console.error('Hoopgrid Today Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
