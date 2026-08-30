/**
 * Shared SQL normalization for regular and postponed prediction rounds.
 *
 * Every consumer provides the configured season as parameter $1. Keeping the
 * conceptual-round and prediction sequencing here prevents the timeline and
 * predictions dashboard from drifting apart.
 */
export const PREDICTION_NORMALIZATION_CTES = `
  base_round_info AS (
    SELECT
      id AS match_id,
      round_id,
      round_name,
      home_score,
      away_score,
      status,
      date,
      TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(round_name, 'Round', 'Jornada', 'gi'),
        '\\s*\\(.*', '', 'gi'
      )) AS base_round,
      MIN(round_id) OVER (PARTITION BY TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(round_name, 'Round', 'Jornada', 'gi'),
        '\\s*\\(.*', '', 'gi'
      ))) AS base_round_id
    FROM matches
    WHERE season_id = $1
  ),
  match_sequences AS (
    SELECT
      match_id,
      base_round,
      base_round_id,
      CASE
        WHEN home_score > away_score THEN '1'
        WHEN away_score > home_score THEN '2'
        ELSE 'X'
      END AS outcome,
      ROW_NUMBER() OVER (
        PARTITION BY base_round
        ORDER BY date ASC, match_id ASC
      ) AS global_pos
    FROM base_round_info
  ),
  user_predictions_unnested AS (
    SELECT
      p.user_id,
      p.round_id,
      TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(p.round_name, 'Round', 'Jornada', 'gi'),
        '\\s*\\(.*', '', 'gi'
      )) AS base_round,
      prediction.pred,
      prediction.idx AS array_pos
    FROM porras p,
      unnest(string_to_array(p.result, '-')) WITH ORDINALITY AS prediction(pred, idx)
    WHERE p.result IS NOT NULL
      AND p.result <> ''
      AND p.season_id = $1
  ),
  user_prediction_sequences AS (
    SELECT
      user_id,
      base_round,
      pred,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, base_round
        ORDER BY round_id ASC, array_pos ASC
      ) AS global_pos
    FROM user_predictions_unnested
  ),
  matched_data AS (
    SELECT
      ups.user_id,
      ms.base_round,
      ms.base_round_id,
      ms.outcome,
      ups.pred,
      ms.global_pos,
      CASE WHEN ms.outcome = ups.pred THEN 1 ELSE 0 END AS is_correct
    FROM match_sequences ms
    JOIN user_prediction_sequences ups
      ON ms.base_round = ups.base_round
      AND ms.global_pos = ups.global_pos
  ),
  conceptual_totals AS (
    SELECT
      md.user_id,
      COALESCE(us.name, u.name) AS usuario,
      COALESCE(us.icon, u.icon) AS user_icon,
      COALESCE(us.color_index, u.color_index, 0) AS color_index,
      md.base_round AS jornada,
      md.base_round_id,
      SUM(md.is_correct) AS total_aciertos,
      string_agg(md.pred, '-' ORDER BY md.global_pos) AS result,
      COUNT(md.global_pos) AS user_matches,
      (SELECT COUNT(*) FROM match_sequences ms2 WHERE ms2.base_round = md.base_round) AS total_matches
    FROM matched_data md
    JOIN users u ON md.user_id = u.id
    LEFT JOIN user_seasons us
      ON us.user_id = u.id
      AND us.season_id = $1
    GROUP BY
      md.user_id,
      COALESCE(us.name, u.name),
      COALESCE(us.icon, u.icon),
      COALESCE(us.color_index, u.color_index, 0),
      md.base_round,
      md.base_round_id
  )
`;
