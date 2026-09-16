import { and, asc, desc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { db as defaultDb } from '../../db/client';
import * as schema from '../../db/schema';
import {
  lineups,
  matches,
  officialTeamMappings,
  playerSeasons,
  players,
  userSeasons,
} from '../../db/schema';
import type { BiwengerRound } from '../rounds';

export type SyncDb = NodePgDatabase<typeof schema> | any;

function splitTopLevelCommas(str: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function resolveDrizzle(client?: any): NodePgDatabase<typeof schema> {
  if (
    client &&
    (typeof client.select === 'function' || typeof client.selectDistinct === 'function')
  ) {
    return client as NodePgDatabase<typeof schema>;
  }
  if (client && typeof client.query === 'function') {
    const wrappedClient = {
      ...client,
      query: async (queryTextOrConfig: any, values?: any, callback?: any) => {
        const sqlText =
          typeof queryTextOrConfig === 'string' ? queryTextOrConfig : queryTextOrConfig?.text;
        const sqlValues =
          typeof queryTextOrConfig === 'string' ? values : (queryTextOrConfig?.values ?? values);

        let res: any;
        if (typeof queryTextOrConfig === 'object' && queryTextOrConfig !== null) {
          try {
            res = await client.query(sqlText, sqlValues, callback);
          } catch {
            res = await client.query(queryTextOrConfig, values, callback);
          }
        } else {
          res = await client.query(queryTextOrConfig, values, callback);
        }

        if (
          queryTextOrConfig?.rowMode === 'array' &&
          res?.rows &&
          res.rows.length > 0 &&
          !Array.isArray(res.rows[0]) &&
          typeof res.rows[0] === 'object'
        ) {
          const text = queryTextOrConfig.text || '';
          const match = text.match(/select\s+(?:distinct\s+)?(.*?)\s+from/i);
          if (match) {
            const cols = splitTopLevelCommas(match[1]).map(
              (c: string) =>
                c
                  .trim()
                  .replace(/"/g, '')
                  .split(/\s+as\s+/i)
                  .pop()!
            );
            return {
              ...res,
              rows: res.rows.map((r: any) =>
                cols.map((col: string) => {
                  if (r[col] !== undefined) return r[col];
                  if (col === 'player_id' && r.id !== undefined) return r.id;
                  if (col === 'id' && r.player_id !== undefined) return r.player_id;
                  return undefined;
                })
              ),
            };
          }
          return {
            ...res,
            rows: res.rows.map((r: any) => Object.values(r)),
          };
        }

        return res;
      },
    };
    return drizzle(wrappedClient, { schema });
  }
  return defaultDb;
}

export interface ExistingPlayerSeasonRecord {
  id: number;
  puntos: number;
  pointsHome: number;
  pointsAway: number;
}

export interface RoundScheduleState {
  lastMatchDate: Date | null;
  firstMatchDate: Date | null;
  allFinished: boolean;
  matchCount: number;
  hasLineups?: boolean;
}

export interface OfficialTeamMappingRecord {
  teamId: number;
  providerTeamCode: string;
}

/**
 * Returns a Set of all known player IDs across all seasons in the database.
 */
export async function getExistingPlayerIdentities(client?: SyncDb): Promise<Set<number>> {
  const db = resolveDrizzle(client);
  const rows = await db.select({ id: players.id }).from(players);
  return new Set(rows.map((r: any) => r.id));
}

/**
 * Returns a dictionary mapping player IDs to their base entity records { id, name }.
 */
export async function getPlayerDirectoryMap(
  client?: SyncDb
): Promise<Record<string, { id: number; name: string | null }>> {
  const db = resolveDrizzle(client);
  const rows = await db.select({ id: players.id, name: players.name }).from(players);
  return Object.fromEntries(rows.map((p: any) => [p.id, p]));
}

/**
 * Returns a Map of existing player season performance data for a given seasonId.
 */
export async function getExistingPlayerSeasonMap(
  seasonId: string,
  client?: SyncDb
): Promise<Map<number, ExistingPlayerSeasonRecord>> {
  const db = resolveDrizzle(client);
  const rows = await db
    .select({
      id: playerSeasons.playerId,
      puntos: playerSeasons.puntos,
      pointsHome: playerSeasons.pointsHome,
      pointsAway: playerSeasons.pointsAway,
    })
    .from(playerSeasons)
    .where(eq(playerSeasons.seasonId, seasonId));

  const map = new Map<number, ExistingPlayerSeasonRecord>();
  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      puntos: row.puntos ?? 0,
      pointsHome: row.pointsHome ?? 0,
      pointsAway: row.pointsAway ?? 0,
    });
  }
  return map;
}

/**
 * Returns a Set of valid/active user display names for the target season.
 */
export async function getSeasonActiveUserNames(
  seasonId: string,
  client?: SyncDb
): Promise<Set<string>> {
  const db = resolveDrizzle(client);
  const rows = await db
    .select({
      name: userSeasons.name,
      status: userSeasons.status,
    })
    .from(userSeasons)
    .where(
      and(
        eq(userSeasons.seasonId, seasonId),
        eq(userSeasons.status, 'active'),
        ne(sql`TRIM(${userSeasons.name})`, '')
      )
    );

  const names = new Set<string>();
  for (const r of rows) {
    const name = r.name;
    if (name) names.add(name);
  }
  return names;
}

/**
 * Returns schedule metrics for a round to optimize sync skipping.
 */
export async function getRoundScheduleState(
  seasonId: string,
  roundId: number,
  checkLineups = false,
  client?: SyncDb
): Promise<RoundScheduleState> {
  const db = resolveDrizzle(client);
  const hasLineupsSql = checkLineups
    ? sql<boolean>`EXISTS(
        SELECT 1 FROM ${lineups} l
        WHERE l.season_id = ${seasonId} AND l.round_id = ${roundId}
      )`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      lastMatchDate: sql<string | null>`MAX(${matches.date})`.as('last_match_date'),
      firstMatchDate: sql<string | null>`MIN(${matches.date})`.as('first_match_date'),
      allFinished: sql<boolean>`BOOL_AND(${matches.status} = 'finished')`.as('all_finished'),
      matchCount: sql<number>`COUNT(*)::int`.as('match_count'),
      hasLineups: hasLineupsSql.as('has_lineups'),
    })
    .from(matches)
    .where(and(eq(matches.seasonId, seasonId), eq(matches.roundId, roundId)));

  const row = rows[0];
  if (!row) {
    return {
      lastMatchDate: null,
      firstMatchDate: null,
      allFinished: false,
      matchCount: 0,
      hasLineups: false,
    };
  }

  const lastMatch = row.lastMatchDate ?? (row as any).last_match_date;
  const firstMatch = row.firstMatchDate ?? (row as any).first_match_date;
  const allFinished = row.allFinished ?? (row as any).all_finished;
  const matchCount = row.matchCount ?? (row as any).match_count;
  const hasLineups = row.hasLineups ?? (row as any).has_lineups;

  return {
    lastMatchDate: lastMatch ? new Date(lastMatch) : null,
    firstMatchDate: firstMatch ? new Date(firstMatch) : null,
    allFinished: Boolean(allFinished),
    matchCount: Number(matchCount) || 0,
    hasLineups: Boolean(hasLineups),
  };
}

/**
 * Returns live/active rounds with games scheduled within -5h to +1h.
 */
export async function getLiveRounds(seasonId: string, client?: SyncDb): Promise<BiwengerRound[]> {
  const db = resolveDrizzle(client);
  const rows = await db
    .selectDistinct({
      id: matches.roundId,
      name: matches.roundName,
    })
    .from(matches)
    .where(
      and(
        eq(matches.seasonId, seasonId),
        isNotNull(matches.roundId),
        isNotNull(matches.officialGameCode),
        ne(matches.status, 'finished'),
        sql`${matches.date} BETWEEN NOW() - INTERVAL '5 hours' AND NOW() + INTERVAL '1 hour'`
      )
    )
    .orderBy(asc(matches.roundId));

  return rows
    .filter((r): r is { id: number; name: string | null } => r.id !== null)
    .map((r) => ({
      id: r.id,
      name: r.name ?? `Round ${r.id}`,
      status: 'active',
    }));
}

/**
 * Returns whether a round has upcoming or live matches within the 1-hour window.
 */
export async function hasActiveMatchesInWindow(
  seasonId: string,
  roundId: number,
  client?: SyncDb
): Promise<boolean> {
  const db = resolveDrizzle(client);
  const rows = await db
    .select({
      count: sql<number>`COUNT(*)::int`,
    })
    .from(matches)
    .where(
      and(
        eq(matches.seasonId, seasonId),
        eq(matches.roundId, roundId),
        sql`(${matches.date} < NOW() + INTERVAL '1 hour' OR ${matches.status} IN ('live', 'finished'))`
      )
    );

  return (rows[0]?.count ?? 0) > 0;
}

/**
 * Returns official team mappings for a season from the euroleague_advanced provider.
 */
export async function getOfficialTeamMappings(
  seasonId: string,
  client?: SyncDb
): Promise<OfficialTeamMappingRecord[]> {
  const db = resolveDrizzle(client);
  const rows = await db
    .select({
      teamId: officialTeamMappings.teamId,
      providerTeamCode: officialTeamMappings.providerTeamCode,
    })
    .from(officialTeamMappings)
    .where(
      and(
        eq(officialTeamMappings.seasonId, seasonId),
        eq(officialTeamMappings.provider, 'euroleague_advanced')
      )
    );

  return rows;
}
