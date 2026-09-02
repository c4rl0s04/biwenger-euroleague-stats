import { eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/lib/db';
import { matches, teams } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export async function listMatchRows() {
  const seasonId = await resolveReadSeasonId();
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  return db
    .select({
      id: matches.id,
      roundId: matches.roundId,
      roundName: matches.roundName,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      date: matches.date,
      status: matches.status,
      homeId: homeTeam.id,
      homeName: homeTeam.name,
      homeCode: homeTeam.code,
      homeImageUrl: homeTeam.img,
      homeCity: homeTeam.city,
      homeArena: homeTeam.arenaName,
      homeLatitude: homeTeam.latitude,
      homeLongitude: homeTeam.longitude,
      awayId: awayTeam.id,
      awayName: awayTeam.name,
      awayCode: awayTeam.code,
      awayImageUrl: awayTeam.img,
      awayCity: awayTeam.city,
      awayArena: awayTeam.arenaName,
      awayLatitude: awayTeam.latitude,
      awayLongitude: awayTeam.longitude,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(eq(matches.seasonId, seasonId))
    .orderBy(matches.roundId, matches.date, matches.id);
}

export type MatchListRow = Awaited<ReturnType<typeof listMatchRows>>[number];
