import { db } from '../../index';
import { matches, teams } from '../../schema';
import { eq, asc, desc, gt, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

export async function getMatchesGroupedByRound() {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      id: matches.id,
      round_id: matches.roundId,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
      date: matches.date,
      status: matches.status,

      home_id: homeTeam.id,
      home_name: homeTeam.name,
      home_img: homeTeam.img,

      away_id: awayTeam.id,
      away_name: awayTeam.name,
      away_img: awayTeam.img,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .orderBy(matches.roundId, matches.date, matches.id);

  // Group by round
  const grouped = rows.reduce(
    (acc, match) => {
      const roundId = match.round_id;
      // Safety check for null roundId (though schema might say integer, it could be null in DB?)
      // Schema says `integer('round_id')` without notNull(), so it can be null.
      // The previous JS code didn't check.
      if (!roundId) return acc;

      if (!acc[roundId]) {
        acc[roundId] = {
          round_id: roundId,
          round_name: `Jornada ${roundId}`, // Default name, can be enriched if round_name exists in schema
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
          img: match.home_img,
          score: match.home_score,
        },
        away: {
          id: match.away_id,
          name: match.away_name,
          img: match.away_img,
          score: match.away_score,
        },
      });

      return acc;
    },
    {} as Record<number, any>
  );

  // Convert to array
  const roundsArr = Object.values(grouped);

  // Sort by date (earliest first) to assign correct round numbers 1-38
  roundsArr.sort((a: any, b: any) => {
    // get earliest date in each round
    const dateA = a.matches[0]?.date ? new Date(a.matches[0].date) : new Date(0);
    const dateB = b.matches[0]?.date ? new Date(b.matches[0].date) : new Date(0);
    return dateA.getTime() - dateB.getTime();
  });

  // Assign sequential names
  roundsArr.forEach((round: any, index: number) => {
    round.round_name = `Jornada ${index + 1}`;
    // Assign a logical index if round_id is arbitrary
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
