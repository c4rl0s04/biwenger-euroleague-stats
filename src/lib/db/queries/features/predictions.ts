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

export interface NormalizedPrediction {
  user_id: string;
  usuario: string;
  user_icon?: string;
  color_index: number;
  jornada: string;
  base_round_id: number;
  aciertos: number;
  result: string;
  is_partial: boolean;
  total_matches: number;
  user_matches: number;
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
  // 1. Fetch normalized data once
  const normalizedData = await getNormalizedPredictions();

  // 2. Parallelize processing of normalized data
  const [achievements, participation, tableStats, performance, history] = await Promise.all([
    getAchievements(normalizedData),
    getParticipation(normalizedData),
    getTableStats(normalizedData),
    getPerformanceData(normalizedData),
    getHistoryPivot(normalizedData),
  ]);

  const clutch = await getClutchStats(normalizedData);
  const victories = await getVictorias(normalizedData);
  const predictable = await getPredictableTeams(); // Match-based, keep separate query
  const bestRound = await getBestRoundStat(normalizedData);

  return {
    achievements,
    participation,
    table_stats: tableStats,
    performance,
    history,
    clutch_stats: clutch,
    porra_stats: {
      victorias: victories,
      predictable_teams: predictable,
      promedios: tableStats,
      mejor_jornada: bestRound,
    },
  };
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * The CORE function for all prediction statistics.
 * Normalizes all partitioned rounds and merges prediction strings correctly.
 */
async function getNormalizedPredictions(): Promise<NormalizedPrediction[]> {
  const query = `
    WITH RoundInfo AS (
        -- Get total matches per conceptual round
        SELECT 
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            COUNT(*) as total_matches,
            MIN(round_id) as base_round_id
        FROM matches
        GROUP BY 1
    ),
    MatchMap AS (
        -- Map each match to its position in its specific round_id
        SELECT 
            id as match_id,
            round_id,
            REGEXP_REPLACE(round_name, '\\s*\\((postponed|aplazada)\\)', '', 'gi') AS base_round,
            ROW_NUMBER() OVER (PARTITION BY round_id ORDER BY id ASC) as part_pos
        FROM matches
    ),
    UserMatchPredictions AS (
        -- Extract individual predictions from hyphenated strings
        SELECT 
            p.user_id,
            p.round_id,
            unnest(string_to_array(p.result, '-')) as pred,
            generate_subscripts(string_to_array(p.result, '-'), 1) as part_pos,
            p.aciertos as part_aciertos
        FROM porras p
        WHERE p.aciertos IS NOT NULL
    ),
    MatchedPredictions AS (
        -- Link predictions to their actual match_ids across the whole season
        SELECT 
            ump.user_id,
            mm.base_round,
            mm.match_id,
            ump.pred,
            ump.round_id,
            ump.part_aciertos
        FROM UserMatchPredictions ump
        JOIN MatchMap mm ON ump.round_id = mm.round_id AND ump.part_pos = mm.part_pos
    ),
    ConceptualSummaries AS (
        -- Aggregate by conceptual round
        SELECT 
            mp.user_id,
            u.name as usuario,
            u.icon as user_icon,
            u.color_index,
            mp.base_round as jornada,
            ri.base_round_id,
            ri.total_matches,
            COUNT(DISTINCT mp.match_id) as user_matches,
            -- Important: result string must be ordered by Match ID across ALL parts
            string_agg(mp.pred, '-' ORDER BY mp.match_id) as merged_result,
            -- Aciertos should be sum of part scores
            (SELECT SUM(DISTINCT part_aciertos) FROM MatchedPredictions sub WHERE sub.user_id = mp.user_id AND sub.base_round = mp.base_round) as total_aciertos
        FROM MatchedPredictions mp
        JOIN users u ON mp.user_id = u.id
        JOIN RoundInfo ri ON mp.base_round = ri.base_round
        GROUP BY mp.user_id, u.name, u.icon, u.color_index, mp.base_round, ri.base_round_id, ri.total_matches
    )
    SELECT 
        *,
        (user_matches < total_matches) as is_partial
    FROM ConceptualSummaries
    ORDER BY base_round_id ASC, total_aciertos DESC
  `;

  const res = await pgClient.query(query);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.total_aciertos),
    total_matches: parseInt(row.total_matches),
    user_matches: parseInt(row.user_matches),
    is_partial: row.is_partial === true,
  }));
}

async function getAchievements(data: NormalizedPrediction[]) {
  const perfect10 = data
    .filter((d) => !d.is_partial && d.aciertos >= 10)
    .map((d) => ({
      aciertos: d.aciertos,
      jornada: d.jornada,
      usuario: d.usuario,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }))
    .sort((a, b) => b.aciertos - a.aciertos);

  const completeOnly = data.filter((d) => !d.is_partial);
  const minScore = completeOnly.length > 0 ? Math.min(...completeOnly.map((d) => d.aciertos)) : 0;
  const blanked = completeOnly
    .filter((d) => d.aciertos === minScore)
    .map((d) => ({
      aciertos: d.aciertos,
      jornada: d.jornada,
      usuario: d.usuario,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }))
    .sort((a, b) => b.aciertos - a.aciertos);

  return { perfect_10: perfect10, blanked: blanked };
}

async function getParticipation(data: NormalizedPrediction[]): Promise<ParticipationStat[]> {
  const roundCounts = data.reduce(
    (acc, curr) => {
      acc[curr.jornada] = (acc[curr.jornada] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueRounds = Array.from(new Set(data.map((d) => d.jornada))).map((name) => {
    const entry = data.find((d) => d.jornada === name);
    return { jornada: name, count: roundCounts[name], sort_id: entry?.base_round_id || 0 };
  });

  return uniqueRounds
    .sort((a, b) => a.sort_id - b.sort_id)
    .map(({ jornada, count }) => ({ jornada, count }));
}

async function getPerformanceData(data: NormalizedPrediction[]): Promise<PorraResult[]> {
  return data
    .sort((a, b) => a.base_round_id - b.base_round_id)
    .map((d) => ({
      jornada: d.jornada,
      usuario: d.usuario,
      aciertos: d.aciertos,
      user_id: parseInt(d.user_id),
      color_index: d.color_index,
      user_icon: d.user_icon,
      is_partial: d.is_partial,
    }));
}

async function getTableStats(data: NormalizedPrediction[]): Promise<TableStat[]> {
  const userMap = new Map<string, NormalizedPrediction[]>();
  data.forEach((d) => {
    if (!userMap.has(d.user_id)) userMap.set(d.user_id, []);
    userMap.get(d.user_id)!.push(d);
  });

  const stats = Array.from(userMap.entries()).map(([userId, userPredictions]) => {
    const complete = userPredictions.filter((p) => !p.is_partial);
    const first = userPredictions[0];

    return {
      user_id: parseInt(userId),
      usuario: first.usuario,
      user_icon: first.user_icon,
      color_index: first.color_index,
      jornadas_jugadas: complete.length,
      total_aciertos: complete.reduce((sum, p) => sum + p.aciertos, 0),
      promedio:
        complete.length > 0
          ? complete.reduce((sum, p) => sum + p.aciertos, 0) / complete.length
          : 0,
      mejor_jornada: complete.length > 0 ? Math.max(...complete.map((p) => p.aciertos)) : 0,
      peor_jornada: complete.length > 0 ? Math.min(...complete.map((p) => p.aciertos)) : 0,
    };
  });

  return stats.sort((a, b) => b.promedio - a.promedio);
}

async function getClutchStats(data: NormalizedPrediction[]): Promise<ClutchStat[]> {
  const uniqueRounds = Array.from(new Set(data.map((d) => d.jornada)))
    .map((name) => ({
      name,
      id: data.find((d) => d.jornada === name)!.base_round_id,
    }))
    .sort((a, b) => b.id - a.id)
    .slice(0, 3)
    .map((r) => r.name);

  if (uniqueRounds.length === 0) return [];

  const userAgg = new Map<
    string,
    { usuario: string; user_id: string; icon: string; color: number; totals: number[] }
  >();

  data
    .filter((d) => uniqueRounds.includes(d.jornada) && !d.is_partial)
    .forEach((d) => {
      if (!userAgg.has(d.user_id)) {
        userAgg.set(d.user_id, {
          usuario: d.usuario,
          user_id: d.user_id,
          icon: d.user_icon || '',
          color: d.color_index,
          totals: [],
        });
      }
      userAgg.get(d.user_id)!.totals.push(d.aciertos);
    });

  return Array.from(userAgg.values())
    .map((u) => ({
      usuario: u.usuario,
      user_id: parseInt(u.user_id),
      user_icon: u.icon,
      color_index: u.color,
      avg_last_3: u.totals.length > 0 ? u.totals.reduce((a, b) => a + b, 0) / u.totals.length : 0,
    }))
    .sort((a, b) => b.avg_last_3 - a.avg_last_3);
}

async function getVictorias(data: NormalizedPrediction[]): Promise<VictoryStat[]> {
  const complete = data.filter((d) => !d.is_partial);
  const roundWinners = new Map<string, string[]>();

  const rounds = Array.from(new Set(complete.map((d) => d.jornada)));
  rounds.forEach((round) => {
    const roundScores = complete.filter((d) => d.jornada === round);
    if (roundScores.length === 0) return;
    const max = Math.max(...roundScores.map((s) => s.aciertos));
    const winners = roundScores.filter((s) => s.aciertos === max).map((s) => s.user_id);
    roundWinners.set(round, winners);
  });

  const victoryCount = new Map<string, number>();
  roundWinners.forEach((winners) => {
    winners.forEach((id) => victoryCount.set(id, (victoryCount.get(id) || 0) + 1));
  });

  const firstEntry = (id: string) => data.find((d) => d.user_id === id)!;

  return Array.from(victoryCount.entries())
    .map(([userId, count]) => {
      const user = firstEntry(userId);
      return {
        usuario: user.usuario,
        user_id: parseInt(userId),
        user_icon: user.user_icon,
        color_index: user.color_index,
        victorias: count,
      };
    })
    .sort((a, b) => b.victorias - a.victorias);
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

async function getBestRoundStat(data: NormalizedPrediction[]): Promise<BestRoundStat[]> {
  return data
    .filter((d) => !d.is_partial)
    .sort((a, b) => b.aciertos - a.aciertos || b.base_round_id - a.base_round_id)
    .slice(0, 5)
    .map((d) => ({
      usuario: d.usuario,
      aciertos: d.aciertos,
      jornada: d.jornada,
      user_id: parseInt(d.user_id),
      user_icon: d.user_icon,
      color_index: d.color_index,
    }));
}

async function getHistoryPivot(data: NormalizedPrediction[]): Promise<HistoryPivot> {
  const users = Array.from(new Set(data.map((d) => d.user_id)))
    .map((id) => {
      const entry = data.find((d) => d.user_id === id)!;
      return { id: parseInt(id), name: entry.usuario, color_index: entry.color_index };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const rounds = Array.from(new Set(data.map((d) => d.jornada)))
    .map((name) => {
      const entry = data.find((d) => d.jornada === name)!;
      return { name, id: entry.base_round_id };
    })
    .sort((a, b) => a.id - b.id);

  const pivotData: HistoryPivotRow[] = rounds.map((round) => {
    const row: HistoryPivotRow = {
      id: round.id,
      name: round.name,
      scores: {},
    };

    users.forEach((user) => {
      const match = data.find((d) => d.jornada === round.name && d.user_id === String(user.id));
      row.scores[user.name] = match
        ? { score: match.aciertos, is_partial: match.is_partial }
        : { score: null, is_partial: false };
    });

    return row;
  });

  return { users, jornadas: pivotData };
}
