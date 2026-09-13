import 'server-only';

import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { db } from '@/lib/db/connection';
import { matches, teamSeasons, teams } from '@/lib/db/schema';
import { resolveReadSeasonId } from '@/lib/db/season-context';

export async function listMatchRows() {
  const seasonId = await resolveReadSeasonId();
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');
  const homeTeamSeason = alias(teamSeasons, 'homeTeamSeason');
  const awayTeamSeason = alias(teamSeasons, 'awayTeamSeason');

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
      homeCity: homeTeamSeason.city,
      homeArena: homeTeamSeason.arenaName,
      homeLatitude: homeTeamSeason.latitude,
      homeLongitude: homeTeamSeason.longitude,
      awayId: awayTeam.id,
      awayName: awayTeam.name,
      awayCode: awayTeam.code,
      awayImageUrl: awayTeam.img,
      awayCity: awayTeamSeason.city,
      awayArena: awayTeamSeason.arenaName,
      awayLatitude: awayTeamSeason.latitude,
      awayLongitude: awayTeamSeason.longitude,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .leftJoin(
      homeTeamSeason,
      and(eq(homeTeamSeason.teamId, homeTeam.id), eq(homeTeamSeason.seasonId, seasonId))
    )
    .leftJoin(
      awayTeamSeason,
      and(eq(awayTeamSeason.teamId, awayTeam.id), eq(awayTeamSeason.seasonId, seasonId))
    )
    .where(eq(matches.seasonId, seasonId))
    .orderBy(matches.roundId, matches.date, matches.id);
}

export type MatchListRow = Awaited<ReturnType<typeof listMatchRows>>[number];
