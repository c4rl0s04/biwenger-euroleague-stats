import {
  getAchievements,
  getParticipation,
  getPerformanceData,
  getTableStats,
  getClutchStats,
  getVictorias,
  getBestRoundStat,
  getHistoryPivot,
} from '@/features/predictions/server';
export {
  getAchievements,
  getParticipation,
  getPerformanceData,
  getTableStats,
  getClutchStats,
  getVictorias,
  getBestRoundStat,
  getHistoryPivot,
} from '@/features/predictions/server';
import type {
  NormalizedPrediction,
  PredictableTeam,
  PorrasStats,
} from '@/features/predictions/public';
export type {
  Achievement,
  ParticipationStat,
  PorraResult,
  TableStat,
  ClutchStat,
  VictoryStat,
  PredictableTeam,
  BestRoundStat,
  HistoryUser,
  HistoryPivotRow,
  NormalizedPrediction,
  HistoryPivot,
  PorrasStats,
} from '@/features/predictions/public';
import { db, pgClient } from '../../index';
import { resolveReadSeasonId } from '../../season-context';
import { PREDICTION_NORMALIZATION_CTES } from './prediction-normalization-sql';

// ==========================================
// INTERFACES
// ==========================================

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
export async function getNormalizedPredictions(): Promise<NormalizedPrediction[]> {
  const seasonId = await resolveReadSeasonId();
  const query = `
    WITH ${PREDICTION_NORMALIZATION_CTES}
    SELECT 
        *,
        (user_matches < total_matches) as is_partial
    FROM conceptual_totals
    ORDER BY base_round_id ASC, total_aciertos DESC
  `;

  const res = await pgClient.query(query, [seasonId]);
  return res.rows.map((row: any) => ({
    ...row,
    aciertos: parseInt(row.total_aciertos),
    total_matches: parseInt(row.total_matches),
    user_matches: parseInt(row.user_matches),
    is_partial: row.is_partial === true,
  }));
}

export async function getPredictableTeams(): Promise<PredictableTeam[]> {
  const seasonId = await resolveReadSeasonId();
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
            ROW_NUMBER() OVER (PARTITION BY round_id ORDER BY date ASC, id ASC) as match_idx
        FROM matches
        WHERE season_id = $1
    ),
    UserPredictions AS (
        SELECT 
            p.user_id,
            p.round_id,
            prediction.pred,
            prediction.idx as match_idx
        FROM porras p,
        unnest(string_to_array(p.result, '-')) WITH ORDINALITY AS prediction(pred, idx)
        WHERE p.aciertos IS NOT NULL
        AND p.season_id = $1
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
        ts.team_id as id,
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
    GROUP BY ts.team_id, t.name, t.img
    HAVING SUM(ts.total_predictions) > 0
    ORDER BY percentage DESC
  `;

  const res = await pgClient.query(query, [seasonId]);
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
