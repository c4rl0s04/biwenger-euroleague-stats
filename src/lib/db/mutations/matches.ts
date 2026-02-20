import { Pool } from 'pg';

// Using a loose type for the db client to support both pg.Pool and the mock object
export type DbClient = Pool | {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }>;
};

// ==========================================
// INTERFACES
// ==========================================

export interface UpsertMatchParams {
  round_id: number;
  round_name: string;
  home_id: number;
  away_id: number;
  date: string | null; // timestamp or string date
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_score_regtime: number | null;
  away_score_regtime: number | null;
  home_q1: number | null;
  away_q1: number | null;
  home_q2: number | null;
  away_q2: number | null;
  home_q3: number | null;
  away_q3: number | null;
  home_q4: number | null;
  away_q4: number | null;
  home_ot: number | null;
  away_ot: number | null;
}

export interface UpdateMatchScoreParams {
  id: number;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

export interface DuplicateRoundInfo {
  base_name: string;
  round_ids: string;
  canonical_id: number;
  count: string;
}

export interface MatchMutations {
  getMappedTeams: () => Promise<{ id: number; code: string; name: string }[]>;
  upsertMatch: (params: UpsertMatchParams) => Promise<void>;
  updateMatchScore: (params: UpdateMatchScoreParams) => Promise<void>;
  findDuplicateRounds: () => Promise<DuplicateRoundInfo[]>;
  deleteMatchesByRound: (roundId: number) => Promise<void>;
  deleteConflictingStats: (oldRoundId: number, newRoundId: number) => Promise<void>;
  updateStatsRound: (oldRoundId: number, newRoundId: number) => Promise<void>;
  mergeUserRoundPoints: (oldRoundId: number, newRoundId: number) => Promise<void>;
  deleteUserRounds: (roundId: number) => Promise<void>;
  deleteLineups: (roundId: number) => Promise<void>;
}

/**
 * Match & Round Mutations (Postgres)
 * Handles Write operations for matches, rounds, and legacy cleanup tasks.
 */
export function prepareMatchMutations(db: DbClient): MatchMutations {
  return {
    getMappedTeams: async () => {
      const res = await db.query('SELECT id, code, name FROM teams WHERE code IS NOT NULL');
      return res.rows;
    },

    upsertMatch: async (params: UpsertMatchParams) => {
      const sql = `
        INSERT INTO matches (
          round_id, round_name, home_id, away_id, date, status, 
          home_score, away_score, home_score_regtime, away_score_regtime,
          home_q1, away_q1, home_q2, away_q2, home_q3, away_q3, home_q4, away_q4, home_ot, away_ot
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, 
          $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT(round_id, home_id, away_id) DO UPDATE SET
          round_name=excluded.round_name,
          status=excluded.status,
          home_score=excluded.home_score,
          away_score=excluded.away_score,
          home_score_regtime=excluded.home_score_regtime,
          away_score_regtime=excluded.away_score_regtime,
          home_q1=excluded.home_q1,
          away_q1=excluded.away_q1,
          home_q2=excluded.home_q2,
          away_q2=excluded.away_q2,
          home_q3=excluded.home_q3,
          away_q3=excluded.away_q3,
          home_q4=excluded.home_q4,
          away_q4=excluded.away_q4,
          home_ot=excluded.home_ot,
          away_ot=excluded.away_ot,
          date=excluded.date
      `;
      const values = [
        params.round_id,
        params.round_name,
        params.home_id,
        params.away_id,
        params.date,
        params.status,
        params.home_score,
        params.away_score,
        params.home_score_regtime,
        params.away_score_regtime,
        params.home_q1,
        params.away_q1,
        params.home_q2,
        params.away_q2,
        params.home_q3,
        params.away_q3,
        params.home_q4,
        params.away_q4,
        params.home_ot,
        params.away_ot,
      ];
      await db.query(sql, values);
    },

    updateMatchScore: async ({ id, home_score, away_score, status }: UpdateMatchScoreParams) => {
      const sql = `
        UPDATE matches 
        SET home_score = $2, away_score = $3, status = $4
        WHERE id = $1
      `;
      await db.query(sql, [id, home_score, away_score, status]);
    },

    // --- Round Cleanup (Merging duplicates) ---

    findDuplicateRounds: async () => {
      const sql = `
        SELECT 
          CASE 
            WHEN round_name LIKE '%(aplazada)%' THEN TRIM(REPLACE(round_name, '(aplazada)', ''))
            ELSE round_name
          END as base_name,
          STRING_AGG(DISTINCT CAST(round_id AS TEXT), ',') as round_ids,
          MIN(round_id) as canonical_id,
          COUNT(DISTINCT round_id) as count
        FROM matches
        GROUP BY base_name
        HAVING COUNT(DISTINCT round_id) > 1
      `;
      const res = await db.query(sql);
      return res.rows;
    },

    deleteMatchesByRound: async (roundId: number) => {
      await db.query('DELETE FROM matches WHERE round_id = $1', [roundId]);
    },

    deleteConflictingStats: async (oldRoundId: number, newRoundId: number) => {
      await db.query(
        `
        DELETE FROM player_round_stats 
        WHERE round_id = $1 
        AND player_id IN (
          SELECT player_id FROM player_round_stats WHERE round_id = $2
        )
        `,
        [oldRoundId, newRoundId]
      );
    },

    updateStatsRound: async (oldRoundId: number, newRoundId: number) => {
      await db.query('UPDATE player_round_stats SET round_id = $2 WHERE round_id = $1', [
        oldRoundId,
        newRoundId,
      ]);
    },

    mergeUserRoundPoints: async (oldRoundId: number, newRoundId: number) => {
      await db.query(
        `
        UPDATE user_rounds 
        SET points = points + COALESCE((
          SELECT points FROM user_rounds ur2 
          WHERE ur2.user_id = user_rounds.user_id AND ur2.round_id = $1
        ), 0)
        WHERE round_id = $2
        `,
        [oldRoundId, newRoundId]
      );
    },

    deleteUserRounds: async (roundId: number) => {
      await db.query('DELETE FROM user_rounds WHERE round_id = $1', [roundId]);
    },

    deleteLineups: async (roundId: number) => {
      await db.query('DELETE FROM lineups WHERE round_id = $1', [roundId]);
    },
  };
}
