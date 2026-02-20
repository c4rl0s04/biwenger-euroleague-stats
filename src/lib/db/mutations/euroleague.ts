import { Pool } from 'pg';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient = Pool | {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
};

// ==========================================
// INTERFACES
// ==========================================

export interface UpsertSyncMetaParams {
  key: string;
  value: string;
  updated_at: string;
}

export interface UpdateTeamMasterParams {
  code: string;
  short_name: string;
  fuzzy_name: string;
}

export interface UpdatePlayerLinkParams {
  el_code: string;
  dorsal: string;
  country: string;
  biwenger_id: number;
}

export interface InsertPlayerMappingParams {
  biwenger_id: number;
  el_code: string;
  json: string;
}

export interface UpdatePlayerEuroleagueCodeParams {
  euroleague_code: string;
  id: number;
}

export interface InsertPlayerStatsParams {
  player_id: number;
  round_id: number;
  fantasy_points: number;
  minutes: number;
  points: number;
  two_points_made: number;
  two_points_attempted: number;
  three_points_made: number;
  three_points_attempted: number;
  free_throws_made: number;
  free_throws_attempted: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  fouls_committed: number;
  valuation: number;
  is_mvp: boolean | number;
}

export interface UpdateFantasyPointsParams {
  player_id: number;
  round_id: number;
  fantasy_points: number;
}

export interface EuroleagueMutations {
  upsertSyncMeta: (params: UpsertSyncMetaParams) => Promise<void>;
  updateTeamMaster: (params: UpdateTeamMasterParams) => Promise<void>;
  updateTeamCode: (code: string, shortName: string, id: number) => Promise<void>;
  getDbTeams: () => Promise<{ id: number; name: string }[]>;
  updatePlayerLink: (params: UpdatePlayerLinkParams) => Promise<void>;
  insertPlayerMapping: (params: InsertPlayerMappingParams) => Promise<void>;
  getBiwengerPlayers: () => Promise<{ id: number; name: string; team_id: number }[]>;
  getPlayerByEuroleagueCode: (code: string) => Promise<{ id: number; name: string } | undefined>;
  getAllPlayers: () => Promise<{ id: number; name: string; team_id: number; euroleague_code: string }[]>;
  updatePlayerEuroleagueCode: (params: UpdatePlayerEuroleagueCodeParams) => Promise<void>;
  insertPlayerStats: (params: InsertPlayerStatsParams) => Promise<void>;
  updateFantasyPoints: (params: UpdateFantasyPointsParams) => Promise<void>;
  updateTeamImage: (img: string, code: string) => Promise<void>;
  updatePlayerImage: (img: string, id: number) => Promise<void>;
  getTeamsWithCode: () => Promise<{ id: number; code: string }[]>;
  getMatchesByRound: (roundId: number) => Promise<{ home_id: number; away_id: number }[]>;
  checkFinishedMatch: (roundId: number, teamId1: number, teamId2: number) => Promise<{ status: string } | undefined>;
  checkStatsExist: (roundId: number) => Promise<{ c: string }>;
}

/**
 * EuroLeague Mutations (Postgres)
 * Handles Write operations for EuroLeague master data, linkage, and statistics.
 */
export function prepareEuroleagueMutations(db: DbClient): EuroleagueMutations {
  return {
    upsertSyncMeta: async (params: UpsertSyncMetaParams) => {
      const sql = `
        INSERT INTO sync_meta (key, value, updated_at) VALUES ($1, $2, $3)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `;
      await db.query(sql, [params.key, params.value, params.updated_at]);
    },

    updateTeamMaster: async (params: UpdateTeamMasterParams) => {
      const sql = `
        UPDATE teams 
        SET code = $1, short_name = $2
        WHERE name LIKE $3 OR short_name = $2
      `;
      // Ensure fuzzy_name includes wildcards if expected
      await db.query(sql, [params.code, params.short_name, params.fuzzy_name]);
    },

    updateTeamCode: async (code: string, shortName: string, id: number) => {
      await db.query('UPDATE teams SET code = $1, short_name = $2 WHERE id = $3', [
        code,
        shortName,
        id,
      ]);
    },

    getDbTeams: async () => {
      const res = await db.query('SELECT id, name FROM teams');
      return res.rows;
    },

    updatePlayerLink: async (params: UpdatePlayerLinkParams) => {
      const sql = `
        UPDATE players
        SET 
            euroleague_code = $1,
            dorsal = $2,
            country = $3
        WHERE id = $4
      `;
      await db.query(sql, [params.el_code, params.dorsal, params.country, params.biwenger_id]);
    },

    insertPlayerMapping: async (params: InsertPlayerMappingParams) => {
      const sql = `
        INSERT INTO player_mappings (biwenger_id, euroleague_code, details_json)
        VALUES ($1, $2, $3)
        ON CONFLICT(biwenger_id) DO UPDATE SET
          euroleague_code = excluded.euroleague_code,
          details_json = excluded.details_json
      `;
      await db.query(sql, [params.biwenger_id, params.el_code, params.json]);
    },

    getBiwengerPlayers: async () => {
      const res = await db.query('SELECT id, name, team_id FROM players');
      return res.rows;
    },

    getPlayerByEuroleagueCode: async (code: string) => {
      const res = await db.query('SELECT id, name FROM players WHERE euroleague_code = $1', [code]);
      return res.rows[0]; // .get() behavior
    },

    getAllPlayers: async () => {
      const res = await db.query('SELECT id, name, team_id, euroleague_code FROM players');
      return res.rows;
    },

    updatePlayerEuroleagueCode: async (params: UpdatePlayerEuroleagueCodeParams) => {
      await db.query('UPDATE players SET euroleague_code = $1 WHERE id = $2', [
        params.euroleague_code,
        params.id,
      ]);
    },

    insertPlayerStats: async (params: InsertPlayerStatsParams) => {
      const sql = `
        INSERT INTO player_round_stats (
          player_id, round_id, fantasy_points, minutes, points,
          two_points_made, two_points_attempted,
          three_points_made, three_points_attempted,
          free_throws_made, free_throws_attempted,
          rebounds, assists, steals, blocks, turnovers, fouls_committed, valuation
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7,
          $8, $9,
          $10, $11,
          $12, $13, $14, $15, $16, $17, $18
        )
        ON CONFLICT(player_id, round_id) DO UPDATE SET
          minutes=excluded.minutes,
          points=excluded.points,
          two_points_made=excluded.two_points_made,
          two_points_attempted=excluded.two_points_attempted,
          three_points_made=excluded.three_points_made,
          three_points_attempted=excluded.three_points_attempted,
          free_throws_made=excluded.free_throws_made,
          free_throws_attempted=excluded.free_throws_attempted,
          rebounds=excluded.rebounds,
          assists=excluded.assists,
          steals=excluded.steals,
          blocks=excluded.blocks,
          turnovers=excluded.turnovers,
          fouls_committed=excluded.fouls_committed,
          valuation=excluded.valuation
      `;
      await db.query(sql, [
        params.player_id,
        params.round_id,
        params.fantasy_points,
        params.minutes,
        params.points,
        params.two_points_made,
        params.two_points_attempted,
        params.three_points_made,
        params.three_points_attempted,
        params.free_throws_made,
        params.free_throws_attempted,
        params.rebounds,
        params.assists,
        params.steals,
        params.blocks,
        params.turnovers,
        params.fouls_committed,
        params.valuation,
      ]);
    },

    updateFantasyPoints: async (params: UpdateFantasyPointsParams) => {
      const sql = `
        INSERT INTO player_round_stats (player_id, round_id, fantasy_points)
        VALUES ($1, $2, $3)
        ON CONFLICT(player_id, round_id) DO UPDATE SET 
        fantasy_points = excluded.fantasy_points
      `;
      await db.query(sql, [params.player_id, params.round_id, params.fantasy_points]);
    },

    updateTeamImage: async (img: string, code: string) => {
      await db.query('UPDATE teams SET img = $1 WHERE code = $2', [img, code]);
    },

    updatePlayerImage: async (img: string, id: number) => {
      await db.query('UPDATE players SET img = $1 WHERE id = $2', [img, id]);
    },

    getTeamsWithCode: async () => {
      const res = await db.query('SELECT id, code FROM teams WHERE code IS NOT NULL');
      return res.rows;
    },

    getMatchesByRound: async (roundId: number) => {
      const res = await db.query('SELECT home_id, away_id FROM matches WHERE round_id = $1', [
        roundId,
      ]);
      return res.rows;
    },

    checkFinishedMatch: async (roundId: number, teamId1: number, teamId2: number) => {
      const res = await db.query(
        'SELECT status FROM matches WHERE round_id = $1 AND (home_id = $2 OR away_id = $3)',
        [roundId, teamId1, teamId2]
      );
      return res.rows[0];
    },

    checkStatsExist: async (roundId: number) => {
      const res = await db.query(
        'SELECT COUNT(*) as c FROM player_round_stats WHERE round_id = $1',
        [roundId]
      );
      return res.rows[0];
    },
  };
}
