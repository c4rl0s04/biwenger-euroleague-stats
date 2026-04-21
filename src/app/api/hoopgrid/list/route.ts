import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hoopgridChallenges } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { HoopgridService } from '@/lib/services/features/hoopgridService';

export async function GET() {
  try {
    const rawChallenges = await db
      .select({
        id: hoopgridChallenges.id,
        gameDate: hoopgridChallenges.gameDate,
        number: hoopgridChallenges.number,
        possibleCounts: hoopgridChallenges.possibleCounts,
      })
      .from(hoopgridChallenges)
      .orderBy(desc(hoopgridChallenges.gameDate));

    const challenges = rawChallenges.map((ch) => ({
      ...ch,
      complexity: HoopgridService.calculateComplexity(ch.possibleCounts),
    }));

    return NextResponse.json({ challenges });
  } catch (error: any) {
    console.error('Hoopgrid List Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
