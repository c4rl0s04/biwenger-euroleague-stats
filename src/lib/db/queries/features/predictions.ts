import { db } from '../../client';

// ==========================================
// INTERFACES
// ==========================================

export interface Achievement {
  aciertos: number;
  jornada: string;
  usuario: string;
  user_id: number;
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
}

export interface TableStat {
  user_id: number;
  usuario: string;
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
  avg_last_3: number;
}

export interface VictoryStat {
  usuario: string;
  user_id: number;
  color_index: number;
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
  scores: Record<string, number | null>;
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
  const perfect10Query = `
    SELECT p.aciertos, p.round_name as jornada, u.name as usuario, p.user_id
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.aciertos = 10
    ORDER BY p.round_id DESC
  `;

  const blankedQuery = `
    WITH MinScore AS (
        SELECT MIN(aciertos) as val FROM porras
    )
    SELECT p.aciertos, p.round_name as jornada, u.name as usuario, p.user_id
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.aciertos = (SELECT val FROM MinScore)
    ORDER BY p.round_id DESC
  `;

  const [perfect10, blanked] = await Promise.all([
    db.query(perfect10Query),
    db.query(blankedQuery),
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
  const query = `
    SELECT round_name as jornada, COUNT(DISTINCT user_id) as count
    FROM porras
    GROUP BY round_id, round_name
    ORDER BY round_id ASC
  `;
  const res = await db.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    count: parseInt(row.count),
  }));
}

async function getPerformanceData(): Promise<PorraResult[]> {
  const query = `
    SELECT p.round_name as jornada, u.name as usuario, p.aciertos, p.user_id, u.color_index
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.aciertos IS NOT NULL
    ORDER BY p.round_id ASC
  `;
  const res = await db.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.aciertos),
  }));
}

async function getTableStats(): Promise<TableStat[]> {
  // Calculates average, total, min, max, count for each user
  const query = `
    WITH UserStats AS (
        SELECT 
            p.user_id,
            u.name as usuario,
            u.color_index,
            COUNT(p.round_id) as jornadas_jugadas,
            SUM(p.aciertos) as total_aciertos,
            AVG(p.aciertos) as promedio,
            MAX(p.aciertos) as mejor_jornada,
            MIN(p.aciertos) as peor_jornada
        FROM porras p
        JOIN users u ON p.user_id = u.id
        GROUP BY p.user_id, u.name, u.color_index
    )
    SELECT * FROM UserStats
    ORDER BY promedio DESC
  `;
  const res = await db.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    jornadas_jugadas: parseInt(row.jornadas_jugadas),
    total_aciertos: parseInt(row.total_aciertos),
    promedio: parseFloat(row.promedio),
    mejor_jornada: parseInt(row.mejor_jornada),
    peor_jornada: parseInt(row.peor_jornada),
  }));
}

async function getClutchStats(): Promise<ClutchStat[]> {
  // Get the last 3 rounds with collected scores
  const roundsQuery = `
    SELECT DISTINCT round_id 
    FROM porras 
    WHERE aciertos IS NOT NULL 
    ORDER BY round_id DESC 
    LIMIT 3
  `;
  const roundsRes = await db.query(roundsQuery);

  if (roundsRes.rows.length === 0) return [];

  const roundIds = roundsRes.rows.map((r: any) => r.round_id);

  const query = `
    SELECT 
        u.name as usuario,
        p.user_id,
        u.color_index,
        AVG(p.aciertos) as avg_last_3
    FROM porras p
    JOIN users u ON p.user_id = u.id
    WHERE p.round_id = ANY($1::int[])
    GROUP BY p.user_id, u.name, u.color_index
    HAVING COUNT(p.round_id) >= 1
    ORDER BY avg_last_3 DESC
  `;

  const res = await db.query(query, [roundIds]);
  return res.rows.map((row: any) => ({
    ...row,
    avg_last_3: parseFloat(row.avg_last_3),
  }));
}

async function getVictorias(): Promise<VictoryStat[]> {
  // 1. Calculate max score per round
  // 2. Count how many times each user achieved that max score

  const query = `
    WITH RoundMax AS (
        SELECT round_id, MAX(aciertos) as max_score
        FROM porras
        GROUP BY round_id
    ),
    Winners AS (
        SELECT p.user_id, p.round_id
        FROM porras p
        JOIN RoundMax rm ON p.round_id = rm.round_id AND p.aciertos = rm.max_score
    )
    SELECT 
        u.name as usuario,
        w.user_id,
        u.color_index,
        COUNT(w.round_id) as victorias
    FROM Winners w
    JOIN users u ON w.user_id = u.id
    GROUP BY w.user_id, u.name, u.color_index
    ORDER BY victorias DESC
  `;

  const res = await db.query(query);
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

  const res = await db.query(query);
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
  // Returns top single round performance of all time
  const query = `
    SELECT u.name as usuario, p.aciertos, p.round_name as jornada
    FROM porras p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.aciertos DESC, p.round_id DESC
    LIMIT 5
  `;
  const res = await db.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.aciertos),
  }));
}

async function getHistoryPivot(): Promise<HistoryPivot> {
  // Get all rounds that have scores
  const roundsRes = await db.query(
    'SELECT DISTINCT round_id, round_name FROM porras WHERE aciertos IS NOT NULL ORDER BY round_id ASC'
  );
  const rounds = roundsRes.rows;

  // Get all users
  const usersRes = await db.query(
    'SELECT DISTINCT u.id, u.name, u.color_index FROM users u JOIN porras p ON p.user_id = u.id ORDER BY u.name'
  );
  // users will now be an array of objects { id, name, color_index }
  const users = usersRes.rows as HistoryUser[];

  // Get all scores
  const scoresQuery = `
    SELECT p.round_id, u.name as usuario, p.aciertos
    FROM porras p
    JOIN users u ON p.user_id = u.id
  `;
  const scoresRes = await db.query(scoresQuery);

  // Pivot data in JS
  const pivotData: HistoryPivotRow[] = rounds.map((round: any) => {
    const row: HistoryPivotRow = {
      id: round.round_id,
      name: round.round_name,
      scores: {},
    };

    users.forEach((user) => {
      const match = scoresRes.rows.find(
        (s: any) => s.round_id === round.round_id && s.usuario === user.name
      );
      row.scores[user.name] = match ? match.aciertos : null;
    });

    return row;
  });

  return {
    users, // Now array of { name, color_index }
    jornadas: pivotData,
  };
}
