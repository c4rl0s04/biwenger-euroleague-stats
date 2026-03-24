import { db } from '../../index';
import { matches, teams } from '../../schema';
import { eq, asc, desc, gt, and, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { FUTURE_MATCH_CONDITION } from '../../sql_utils';

export async function getMatchesGroupedByRound() {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      round_id: matches.roundId,
      round_name: matches.roundName, // <-- Fetching official roundName
      home_score: matches.homeScore,
      away_score: matches.awayScore,
      date: matches.date,
      status: matches.status,

      home_id: homeTeam.id,
      home_name: homeTeam.name,
      home_code: homeTeam.code,
      home_img: homeTeam.img,
      home_city: homeTeam.city,
      home_arena: homeTeam.arenaName,
      home_lat: homeTeam.latitude,
      home_lng: homeTeam.longitude,

      away_id: awayTeam.id,
      away_name: awayTeam.name,
      away_code: awayTeam.code,
      away_img: awayTeam.img,
      away_city: awayTeam.city,
      away_arena: awayTeam.arenaName,
      away_lat: awayTeam.latitude,
      away_lng: awayTeam.longitude,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .orderBy(matches.roundId, matches.date, matches.id);

  // Group by round
  const grouped = rows.reduce(
    (acc, match) => {
      const roundId = match.round_id;
      // Safety check for null roundId
      if (!roundId) return acc;

      if (!acc[roundId]) {
        acc[roundId] = {
          round_id: roundId,
          // Use official name from DB, fallback if missing
          round_name: match.round_name || `Jornada ${roundId}`,
          matches: [],
        };
      }

      acc[roundId].matches.push({
        id: match.id,
        date: match.date,
        status: match.status,
        home: {
          id: match.home_id,
          name: match.home_name,
          code: match.home_code,
          img: match.home_img,
          score: match.home_score,
          city: match.home_city,
          arena: match.home_arena,
          latitude: match.home_lat,
          longitude: match.home_lng,
        },
        away: {
          id: match.away_id,
          name: match.away_name,
          code: match.away_code,
          img: match.away_img,
          score: match.away_score,
          city: match.away_city,
          arena: match.away_arena,
          latitude: match.away_lat,
          longitude: match.away_lng,
        },
      });

      return acc;
    },
    {} as Record<number, any>
  );

  // Convert to array
  const roundsArr = Object.values(grouped);

  // Sort by round_id to maintain official sequence (1 to 38)
  // regardless of advanced or postponed match dates
  roundsArr.sort((a: any, b: any) => a.round_id - b.round_id);

  // Assign sequential internal index just in case UI uses it for state,
  // but DO NOT overwrite the official round_name.
  roundsArr.forEach((round: any, index: number) => {
    round.round_index = index + 1;
  });

  return roundsArr;
}

export async function getUpcomingMatches(limit = 5) {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(sql`${matches.date} > NOW()`)
    .orderBy(matches.date)
    .limit(limit);

  return rows;
}

export async function getRecentResults(limit = 5) {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      date: matches.date,
      home_team: homeTeam.name,
      away_team: awayTeam.name,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(eq(matches.status, 'finished'))
    .orderBy(desc(matches.date))
    .limit(limit);

  return rows;
}

export interface TeamUpcomingMatch {
  date: Date | string;
  home_team: string;
  away_team: string;
  home_img: string;
  away_img: string;
  home_id: number;
  away_id: number;
  home_score: number | null;
  away_score: number | null;
  round_name: string;
}

/**
 * Get the next upcoming matches for a specific team
 */
export async function getTeamUpcomingMatches(
  teamId: number,
  limit = 3
): Promise<TeamUpcomingMatch[]> {
  const th = alias(teams, 'th');
  const ta = alias(teams, 'ta');

  const rows = await db
    .select({
      date: matches.date,
      home_team: th.name,
      away_team: ta.name,
      home_img: th.img,
      away_img: ta.img,
      home_id: matches.homeId,
      away_id: matches.awayId,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
      round_name: matches.roundName,
    })
    .from(matches)
    .leftJoin(th, eq(matches.homeId, th.id))
    .leftJoin(ta, eq(matches.awayId, ta.id))
    .where(
      and(or(eq(matches.homeId, teamId), eq(matches.awayId, teamId)), sql`${matches.date} > NOW()`)
    )
    .orderBy(asc(matches.date))
    .limit(limit);

  return rows.map((r) => ({
    date: r.date || new Date(),
    home_team: r.home_team || 'TBD',
    away_team: r.away_team || 'TBD',
    home_img: r.home_img || '',
    away_img: r.away_img || '',
    home_id: r.home_id || 0,
    away_id: r.away_id || 0,
    home_score: r.home_score,
    away_score: r.away_score,
    round_name: r.round_name || '',
  })) as TeamUpcomingMatch[];
}
