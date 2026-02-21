import { db } from '../../index';
import { matches, teams, players } from '../../schema';
import { eq, desc, asc, min, max, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

// 1. Get List of Rounds (with deduplication logic handled in JS for now or refined SQL)
export async function getScheduleRounds() {
  // Select distinct roundId, roundName, and min(date) for ordering
  const rows = await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
      min_date: min(matches.date),
    })
    .from(matches)
    .groupBy(matches.roundId, matches.roundName)
    .orderBy(asc(min(matches.date)));

  // Deduplication Logic (same as legacy)
  const roundMap = new Map();

  for (const r of rows) {
    if (!r.round_name) continue;

    // Normalize name: "Jornada 14 (aplazada)" -> "Jornada 14"
    const baseName = r.round_name.replace(/\s*\(.*\)/, '').trim();

    if (!roundMap.has(baseName)) {
      roundMap.set(baseName, { ...r, round_name: baseName });
    } else {
      // If we found a duplicate (e.g. we have "Jornada 14", now found "Jornada 14 (aplazada)")
      // logic: if current row has 'aplazada', overwrite.
      if (r.round_name.toLowerCase().includes('aplazada')) {
        roundMap.set(baseName, { ...r, round_name: baseName });
      }
    }
  }

  return Array.from(roundMap.values());
}

// 2. Get Round by ID
export async function getRoundById(roundId: number) {
  const result = await db
    .selectDistinct({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .where(eq(matches.roundId, roundId))
    .limit(1);

  return result[0];
}

// 3. Get Last Round
export async function getLastRound() {
  const result = await db
    .select({
      round_id: matches.roundId,
      round_name: matches.roundName,
    })
    .from(matches)
    .orderBy(desc(matches.date))
    .limit(1);

  return result[0];
}

// 4. Fetch Matches for Round
export async function fetchMatchesForRound(roundId: number) {
  const homeTeam = alias(teams, 'homeTeam');
  const awayTeam = alias(teams, 'awayTeam');

  const rows = await db
    .select({
      match_id: matches.id,
      date: matches.date,
      home_id: matches.homeId,
      away_id: matches.awayId,
      home_team: homeTeam.shortName, // mapped from 'short_name'
      away_team: awayTeam.shortName,
      home_code: homeTeam.code,
      away_code: awayTeam.code,
    })
    .from(matches)
    .leftJoin(homeTeam, eq(matches.homeId, homeTeam.id))
    .leftJoin(awayTeam, eq(matches.awayId, awayTeam.id))
    .where(eq(matches.roundId, roundId))
    .orderBy(asc(matches.date));

  return rows;
}

// 5. Fetch User Players
export async function fetchUserPlayers(userId: number) {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      team_id: players.teamId,
      team_name: teams.shortName,
      team_code: teams.code,
      position: players.position,
      price: players.price,
      img: players.img,
      puntos: players.puntos, // 'puntos' column
    })
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .where(eq(players.ownerId, userId.toString()));

  return rows;
}
