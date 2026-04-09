import { db, pgClient } from '../../index';

// ==========================================
// INTERFACES
// ==========================================

export interface Achievement {
  aciertos: number;
  jornada: string;
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
}

export interface ParticipationStat {
  jornada: string;
  count: number;
}

export interface PorraResult {
  jornada: string;
  usuario: string;
  aciertos: number;
  user_id: number;
  color_index: number;
  user_icon?: string;
  is_partial: boolean;
}

export interface TableStat {
  user_id: number;
  usuario: string;
  user_icon?: string;
  color_index: number;
  jornadas_jugadas: number;
  total_aciertos: number;
  promedio: number;
  mejor_jornada: number;
  peor_jornada: number;
}

export interface ClutchStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  avg_last_3: number;
}

export interface VictoryStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  victorias: number;
}

export interface PredictableTeam {
  id: number;
  name: string;
  img: string;
  total: number;
  correct: number;
  predicted_wins: number;
  predicted_losses: number;
  correct_wins: number;
  correct_losses: number;
  percentage: number;
}

export interface BestRoundStat {
  usuario: string;
  user_id: number;
  color_index: number;
  user_icon?: string;
  aciertos: number;
  jornada: string;
}

export interface HistoryUser {
  id: number;
  name: string;
  color_index: number;
}

export interface HistoryPivotRow {
  id: number;
  name: string;
  scores: Record<string, { score: number | null; is_partial: boolean }>;
}

export interface HistoryPivot {
  users: HistoryUser[];
  jornadas: HistoryPivotRow[];
}

export interface PorrasStats {
  achievements: {
    perfect_10: Achievement[];
    blanked: Achievement[];
  };
  participation: ParticipationStat[];
  table_stats: TableStat[];
  performance: PorraResult[];
  history: HistoryPivot;
  clutch_stats: ClutchStat[];
  porra_stats: {
    victorias: VictoryStat[];
    predictable_teams: PredictableTeam[];
    promedios: TableStat[];
    mejor_jornada: BestRoundStat[];
  };
}

// ==========================================
// MAIN FUNCTION
// ==========================================

/**
 * Fetches all statistics needed for the predictions dashboard.
 * Optimizes performance by using parallel queries where possible.
 */
export async function getPorrasStats(): Promise<PorrasStats> {
  // Parallelize independent queries
  const [achievements, participation, tableStats, performance, history] = await Promise.all([
    getAchievements(),
    getParticipation(),
    getTableStats(),
    getPerformanceData(),
    getHistoryPivot(),
  ]);

  const clutch = await getClutchStats();
  const victories = await getVictorias();
  const predictable = await getPredictableTeams();
  const bestRound = await getBestRoundStat();

  return {
    achievements,
    participation,
    table_stats: tableStats,
    performance,
    history,
    clutch_stats: clutch,
    porra_stats: {
      // Grouping common stats under the structure expected by the UI if needed
      victorias: victories,
      predictable_teams: predictable,
      promedios: tableStats, // Refers to the main leaderboard table
      mejor_jornada: bestRound,
    },
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function getAchievements() {
  // Normalize rounds to correctly identify Perfect 10s and Blanked across postponed parts.
  const commonCTE = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    ),
    NormalizedPorras AS (
        SELECT
            p.user_id,
            REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            MIN(p.round_id) AS base_round_id,
            SUM(p.aciertos) AS aciertos,
            COUNT(DISTINCT p.round_id) AS user_parts,
            rp.total_parts
        FROM porras p
        JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
        WHERE p.aciertos IS NOT NULL
        GROUP BY p.user_id, REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'), rp.total_parts
    ),
    CompleteOnly AS (
        SELECT * FROM NormalizedPorras WHERE user_parts = total_parts
    )
  `;

  const perfect10Query = `
    ${commonCTE}
    SELECT
        co.aciertos,
        co.base_round as jornada,
        u.name as usuario,
        co.user_id,
        u.icon as user_icon,
        u.color_index
    FROM CompleteOnly co
    JOIN users u ON co.user_id = u.id
    WHERE co.aciertos >= 10
    ORDER BY co.base_round_id DESC
  `;

  const blankedQuery = `
    ${commonCTE},
    MinScore AS (
        SELECT MIN(aciertos) as val FROM CompleteOnly
    )
    SELECT
        co.aciertos,
        co.base_round as jornada,
        u.name as usuario,
        co.user_id,
        u.icon as user_icon,
        u.color_index
    FROM CompleteOnly co
    JOIN users u ON co.user_id = u.id
    WHERE co.aciertos = (SELECT val FROM MinScore)
    ORDER BY co.base_round_id DESC
  `;

  const [perfect10, blanked] = await Promise.all([
    pgClient.query(perfect10Query),
    pgClient.query(blankedQuery),
  ]);

  return {
    perfect_10: perfect10.rows.map((row: any) => ({
      ...row,
      aciertos: parseInt(row.aciertos),
    })),
    blanked: blanked.rows.map((row: any) => ({
      ...row,
      aciertos: parseInt(row.aciertos),
    })),
  };
}

async function getParticipation(): Promise<ParticipationStat[]> {
  // Group by base round name (merging postponed parts) and take min round_id for ordering.
  const query = `
    SELECT
        REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS jornada,
        MIN(round_id) AS sort_id,
        COUNT(DISTINCT user_id) as count
    FROM porras
    GROUP BY REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi')
    ORDER BY sort_id ASC
  `;
  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    count: parseInt(row.count),
  }));
}

async function getPerformanceData(): Promise<PorraResult[]> {
  // Merge postponed rows, carry is_partial flag for chart styling.
  const query = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    )
    SELECT
        REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS jornada,
        MIN(p.round_id) AS sort_id,
        u.name AS usuario,
        SUM(p.aciertos) AS aciertos,
        p.user_id,
        u.color_index,
        u.icon AS user_icon,
        (COUNT(DISTINCT p.round_id) < rp.total_parts) AS is_partial
    FROM porras p
    JOIN users u ON p.user_id = u.id
    JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
    WHERE p.aciertos IS NOT NULL
    GROUP BY
        REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'),
        p.user_id, u.name, u.color_index, u.icon, rp.total_parts
    ORDER BY sort_id ASC
  `;
  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.aciertos),
    is_partial: row.is_partial === true,
  }));
}

async function getTableStats(): Promise<TableStat[]> {
  // Only complete rounds (user played all parts) count toward all stats.
  const query = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    ),
    NormalizedPorras AS (
        SELECT
            p.user_id,
            REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            SUM(p.aciertos) AS aciertos,
            COUNT(DISTINCT p.round_id) AS user_parts,
            rp.total_parts
        FROM porras p
        JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
        WHERE p.aciertos IS NOT NULL
        GROUP BY p.user_id, REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'), rp.total_parts
    ),
    CompleteOnly AS (
        SELECT * FROM NormalizedPorras WHERE user_parts = total_parts
    ),
    UserStats AS (
        SELECT
            co.user_id,
            u.name AS usuario,
            u.icon AS user_icon,
            u.color_index,
            COUNT(*) AS jornadas_jugadas,
            SUM(co.aciertos) AS total_aciertos,
            AVG(co.aciertos) AS promedio,
            COUNT(CASE WHEN co.aciertos = 10 THEN 1 END) AS perfects,
            COUNT(CASE WHEN co.aciertos >= 8 THEN 1 END) AS exacts,
            MAX(co.aciertos) AS mejor_jornada,
            MIN(co.aciertos) AS peor_jornada
        FROM CompleteOnly co
        JOIN users u ON co.user_id = u.id
        GROUP BY co.user_id, u.name, u.icon, u.color_index
    )
    SELECT * FROM UserStats
    ORDER BY promedio DESC
  `;
  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    jornadas_jugadas: parseInt(row.jornadas_jugadas),
    total_aciertos: parseInt(row.total_aciertos),
    promedio: parseFloat(row.promedio),
    perfects: parseInt(row.perfects || '0'),
    exacts: parseInt(row.exacts || '0'),
    mejor_jornada: parseInt(row.mejor_jornada),
    peor_jornada: parseInt(row.peor_jornada),
  }));
}

async function getClutchStats(): Promise<ClutchStat[]> {
  // Get the last 3 *conceptual* complete rounds (ignoring postponed duplicates).
  const roundsQuery = `
    SELECT
        REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
        MAX(round_id) AS max_round_id
    FROM porras
    WHERE aciertos IS NOT NULL
    GROUP BY REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi')
    ORDER BY max_round_id DESC
    LIMIT 3
  `;
  const roundsRes = await pgClient.query(roundsQuery);

  if (roundsRes.rows.length === 0) return [];

  const baseRounds = roundsRes.rows.map((r: any) => r.base_round);

  // Only count complete rounds (user played all parts) for clutch ranking.
  const simpleQuery = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    )
    SELECT
        p.user_id,
        u.name AS usuario,
        u.icon AS user_icon,
        u.color_index,
        REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
        SUM(p.aciertos) AS round_total,
        COUNT(DISTINCT p.round_id) AS user_parts,
        rp.total_parts
    FROM porras p
    JOIN users u ON p.user_id = u.id
    JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
    WHERE REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = ANY($1::text[])
      AND p.aciertos IS NOT NULL
    GROUP BY p.user_id, u.name, u.icon, u.color_index,
             REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'), rp.total_parts
    HAVING COUNT(DISTINCT p.round_id) = rp.total_parts
  `;

  const simpleRes = await pgClient.query(simpleQuery, [baseRounds]);

  // Group by user and calculate average across complete rounds only
  const userAgg = new Map<
    string,
    { usuario: string; user_id: string; user_icon: string; color_index: number; totals: number[] }
  >();
  for (const row of simpleRes.rows) {
    if (!userAgg.has(row.user_id)) {
      userAgg.set(row.user_id, {
        usuario: row.usuario,
        user_id: row.user_id,
        user_icon: row.user_icon,
        color_index: row.color_index,
        totals: [],
      });
    }
    userAgg.get(row.user_id)!.totals.push(parseFloat(row.round_total));
  }

  return Array.from(userAgg.values())
    .map((u) => ({
      usuario: u.usuario,
      user_id: u.user_id,
      user_icon: u.user_icon,
      color_index: u.color_index,
      avg_last_3: u.totals.reduce((a, b) => a + b, 0) / u.totals.length,
    }))
    .sort((a, b) => b.avg_last_3 - a.avg_last_3);
}

async function getVictorias(): Promise<VictoryStat[]> {
  // Only complete rounds can be "won" — partial rounds excluded.
  const query = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    ),
    NormalizedPorras AS (
        SELECT
            p.user_id,
            REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            MIN(p.round_id) AS base_round_id,
            SUM(p.aciertos) AS aciertos,
            COUNT(DISTINCT p.round_id) AS user_parts,
            rp.total_parts
        FROM porras p
        JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
        WHERE p.aciertos IS NOT NULL
        GROUP BY p.user_id, REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'), rp.total_parts
    ),
    CompleteOnly AS (
        SELECT * FROM NormalizedPorras WHERE user_parts = total_parts
    ),
    RoundMax AS (
        SELECT base_round, MAX(aciertos) AS max_score
        FROM CompleteOnly
        GROUP BY base_round
    ),
    Winners AS (
        SELECT co.user_id, co.base_round
        FROM CompleteOnly co
        JOIN RoundMax rm ON co.base_round = rm.base_round AND co.aciertos = rm.max_score
    )
    SELECT
        u.name AS usuario,
        w.user_id,
        u.icon AS user_icon,
        u.color_index,
        COUNT(w.base_round) AS victorias
    FROM Winners w
    JOIN users u ON w.user_id = u.id
    GROUP BY w.user_id, u.name, u.icon, u.color_index
    ORDER BY victorias DESC
  `;

  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    victorias: parseInt(row.victorias),
  }));
}

async function getPredictableTeams(): Promise<PredictableTeam[]> {
  const query = `
    WITH MatchOutcomes AS (
        SELECT 
            round_id,
            home_id,
            away_id,
            CASE 
                WHEN home_score > away_score THEN '1'
                WHEN away_score > home_score THEN '2'
                ELSE 'X'
            END as outcome,
            ROW_NUMBER() OVER (PARTITION BY round_id ORDER BY id ASC) as match_idx
        FROM matches
        WHERE NOT (home_score = 0 AND away_score = 0)
    ),
    UserPredictions AS (
        SELECT 
            p.user_id,
            p.round_id,
            p.aciertos,
            unnest(string_to_array(p.result, '-')) as pred,
            generate_subscripts(string_to_array(p.result, '-'), 1) as match_idx
        FROM porras p
        WHERE p.aciertos IS NOT NULL
    ),
    PredictionResults AS (
        SELECT 
            up.user_id,
            mo.home_id,
            mo.away_id,
            mo.outcome,
            up.pred,
            (mo.outcome = up.pred) as is_correct
        FROM MatchOutcomes mo
        JOIN UserPredictions up ON mo.round_id = up.round_id AND mo.match_idx = up.match_idx
    ),
    TeamStats AS (
        -- Home Games
        SELECT 
            home_id as team_id,
            COUNT(*) as total_predictions,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_predictions,
            SUM(CASE WHEN pred = '1' THEN 1 ELSE 0 END) as predicted_wins,
            SUM(CASE WHEN pred = '2' THEN 1 ELSE 0 END) as predicted_losses,
            SUM(CASE WHEN is_correct AND pred = '1' THEN 1 ELSE 0 END) as correct_wins,
            SUM(CASE WHEN is_correct AND pred = '2' THEN 1 ELSE 0 END) as correct_losses
        FROM PredictionResults
        GROUP BY home_id
        
        UNION ALL
        
        -- Away Games
        SELECT 
            away_id as team_id,
            COUNT(*) as total_predictions,
            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_predictions,
            SUM(CASE WHEN pred = '2' THEN 1 ELSE 0 END) as predicted_wins,
            SUM(CASE WHEN pred = '1' THEN 1 ELSE 0 END) as predicted_losses,
            SUM(CASE WHEN is_correct AND pred = '2' THEN 1 ELSE 0 END) as correct_wins,
            SUM(CASE WHEN is_correct AND pred = '1' THEN 1 ELSE 0 END) as correct_losses
        FROM PredictionResults
        GROUP BY away_id
    )
    SELECT 
        t.id,
        t.name,
        t.img,
        SUM(ts.total_predictions) as total,
        SUM(ts.correct_predictions) as correct,
        SUM(ts.predicted_wins) as predicted_wins,
        SUM(ts.predicted_losses) as predicted_losses,
        SUM(ts.correct_wins) as correct_wins,
        SUM(ts.correct_losses) as correct_losses,
        ROUND((SUM(ts.correct_predictions)::decimal / NULLIF(SUM(ts.total_predictions), 0)) * 100, 1) as percentage
    FROM TeamStats ts
    JOIN teams t ON ts.team_id = t.id
    GROUP BY t.id, t.name, t.img
    HAVING SUM(ts.total_predictions) > 0
    ORDER BY percentage DESC
  `;

  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    total: parseInt(row.total),
    correct: parseInt(row.correct),
    predicted_wins: parseInt(row.predicted_wins),
    predicted_losses: parseInt(row.predicted_losses),
    correct_wins: parseInt(row.correct_wins),
    correct_losses: parseInt(row.correct_losses),
    percentage: parseFloat(row.percentage),
  }));
}

async function getBestRoundStat(): Promise<BestRoundStat[]> {
  // Only complete rounds count for the all-time record.
  const query = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    ),
    NormalizedPorras AS (
        SELECT
            p.user_id,
            REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            MIN(p.round_id) AS base_round_id,
            SUM(p.aciertos) AS aciertos,
            COUNT(DISTINCT p.round_id) AS user_parts,
            rp.total_parts
        FROM porras p
        JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
        WHERE p.aciertos IS NOT NULL
        GROUP BY p.user_id, REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'), rp.total_parts
    )
    SELECT
        u.name AS usuario,
        np.aciertos,
        np.base_round AS jornada,
        u.id AS user_id,
        u.icon AS user_icon,
        u.color_index
    FROM NormalizedPorras np
    JOIN users u ON np.user_id = u.id
    WHERE np.user_parts = np.total_parts
    ORDER BY np.aciertos DESC, np.base_round_id DESC
    LIMIT 5
  `;
  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.aciertos),
  }));
}

async function getHistoryPivot(): Promise<HistoryPivot> {
  // Get all DISTINCT base rounds (merged) ordered chronologically
  const roundsRes = await pgClient.query(`
    SELECT
        REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
        MIN(round_id) AS base_round_id,
        COUNT(DISTINCT round_id) AS total_parts
    FROM porras
    WHERE aciertos IS NOT NULL
    GROUP BY REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi')
    ORDER BY base_round_id ASC
  `);
  const rounds = roundsRes.rows;

  // Get all users
  const usersRes = await pgClient.query(
    'SELECT DISTINCT u.id, u.name, u.color_index FROM users u JOIN porras p ON p.user_id = u.id ORDER BY u.name'
  );
  const users = usersRes.rows as HistoryUser[];

  // Get all scores merged by base round per user, with is_partial flag
  const scoresQuery = `
    WITH RoundParts AS (
        SELECT
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(DISTINCT round_id) AS total_parts
        FROM porras GROUP BY 1
    )
    SELECT
        REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
        u.name AS usuario,
        SUM(p.aciertos) AS aciertos,
        (COUNT(DISTINCT p.round_id) < rp.total_parts) AS is_partial
    FROM porras p
    JOIN users u ON p.user_id = u.id
    JOIN RoundParts rp ON REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') = rp.base_round
    WHERE p.aciertos IS NOT NULL
    GROUP BY
        REGEXP_REPLACE(p.round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi'),
        u.name, rp.total_parts
  `;
  const scoresRes = await pgClient.query(scoresQuery);

  // Pivot data in JS — scores now carry { score, is_partial }
  const pivotData: HistoryPivotRow[] = rounds.map((round: any) => {
    const row: HistoryPivotRow = {
      id: round.base_round_id,
      name: round.base_round,
      scores: {},
    };

    users.forEach((user) => {
      const match = scoresRes.rows.find(
        (s: any) => s.base_round === round.base_round && s.usuario === user.name
      );
      row.scores[user.name] = match
        ? { score: parseInt(match.aciertos), is_partial: match.is_partial === true }
        : { score: null, is_partial: false };
    });

    return row;
  });

  return {
    users,
    jornadas: pivotData,
  };
}
