import { db } from '../../index';
import { matches, teams } from '../../schema';
import { eq, asc, desc, gt, and, sql, or } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { FUTURE_MATCH_CONDITION } from '../../sql_utils';
import { resolveReadSeasonId } from '../../season-context';

export async function getUpcomingMatches(limit = 5) {
  const seasonId = await resolveReadSeasonId();
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
    .where(and(eq(matches.seasonId, seasonId), sql`${matches.date} > NOW()`))
    .orderBy(matches.date)
    .limit(limit);

  return rows;
}

export async function getRecentResults(limit = 5) {
  const seasonId = await resolveReadSeasonId();
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
    .where(and(eq(matches.seasonId, seasonId), eq(matches.status, 'finished')))
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
  difficulty?: 'Fácil' | 'Normal' | 'Duro';
}

/**
 * Get a performance map of all teams (wins/losses home and away)
 */
export async function getTeamPerformanceMap(): Promise<Record<number, any>> {
  const seasonId = await resolveReadSeasonId();
  const allFinishedMatches = await db
    .select({
      homeId: matches.homeId,
      awayId: matches.awayId,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
    })
    .from(matches)
    .where(and(eq(matches.seasonId, seasonId), eq(matches.status, 'finished')));

  const teamStats: Record<number, any> = {};

  const initTeam = (id: number) => {
    if (!teamStats[id]) {
      teamStats[id] = {
        homeGames: 0,
        homeWins: 0,
        awayGames: 0,
        awayWins: 0,
        totalGames: 0,
        totalWins: 0,
      };
    }
  };

  allFinishedMatches.forEach((m) => {
    if (!m.homeId || !m.awayId || m.homeScore === null || m.awayScore === null) return;

    initTeam(m.homeId);
    initTeam(m.awayId);

    const homeWon = m.homeScore > m.awayScore;

    teamStats[m.homeId].homeGames += 1;
    teamStats[m.homeId].totalGames += 1;
    if (homeWon) {
      teamStats[m.homeId].homeWins += 1;
      teamStats[m.homeId].totalWins += 1;
    }

    teamStats[m.awayId].awayGames += 1;
    teamStats[m.awayId].totalGames += 1;
    if (!homeWon) {
      teamStats[m.awayId].awayWins += 1;
      teamStats[m.awayId].totalWins += 1;
    }
  });

  // Calculate percentages
  Object.keys(teamStats).forEach((idStr) => {
    const id = Number(idStr);
    const stats = teamStats[id];
    stats.homeWinPct = stats.homeGames > 0 ? stats.homeWins / stats.homeGames : 0.5; // default 50%
    stats.awayWinPct = stats.awayGames > 0 ? stats.awayWins / stats.awayGames : 0.5;
    stats.overallWinPct = stats.totalGames > 0 ? stats.totalWins / stats.totalGames : 0.5;
  });

  return teamStats;
}

/**
 * Get the next upcoming matches for a specific team
 */
export async function getTeamUpcomingMatches(
  teamId: number,
  limit = 3
): Promise<TeamUpcomingMatch[]> {
  const seasonId = await resolveReadSeasonId();
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
      and(
        or(eq(matches.homeId, teamId), eq(matches.awayId, teamId)),
        eq(matches.seasonId, seasonId),
        sql`${matches.date} > NOW()`
      )
    )
    .orderBy(asc(matches.date))
    .limit(limit);

  // Fetch performance map to calculate difficulty
  const performanceMap = await getTeamPerformanceMap();

  return rows.map((r) => {
    let difficulty: 'Fácil' | 'Normal' | 'Duro' = 'Normal';

    // Calculate opponent's context-specific difficulty
    if (r.home_id && r.away_id) {
      if (r.home_id === teamId) {
        // Player's team is Home -> Opponent is Away. Check opponent's away win pct.
        const oppStats = performanceMap[r.away_id];
        if (oppStats) {
          if (oppStats.awayWinPct >= 0.6) difficulty = 'Duro';
          else if (oppStats.awayWinPct < 0.4) difficulty = 'Fácil';
        }
      } else {
        // Player's team is Away -> Opponent is Home. Check opponent's home win pct.
        const oppStats = performanceMap[r.home_id];
        if (oppStats) {
          if (oppStats.homeWinPct >= 0.6) difficulty = 'Duro';
          else if (oppStats.homeWinPct < 0.4) difficulty = 'Fácil';
        }
      }
    }

    return {
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
      difficulty,
    };
  }) as TeamUpcomingMatch[];
}
/**
 * Get the most recent matches for a specific team
 */
export async function getTeamRecentMatches(
  teamId: number,
  limit = 5
): Promise<TeamUpcomingMatch[]> {
  const seasonId = await resolveReadSeasonId();
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
      and(
        or(eq(matches.homeId, teamId), eq(matches.awayId, teamId)),
        eq(matches.seasonId, seasonId),
        eq(matches.status, 'finished')
      )
    )
    .orderBy(desc(matches.date))
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
