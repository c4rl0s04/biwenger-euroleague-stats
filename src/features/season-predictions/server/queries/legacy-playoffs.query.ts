import 'server-only';

import type { Pool, PoolClient } from 'pg';
import { pool } from '@/lib/db/client';

const database = pool as Pool;
type Connection = Pool | PoolClient;

/** 2025-26 playoff predictions live in the legacy tables; read them for an explicit season. */
export interface LegacyPlayoffRows {
  members: { userId: string; name: string | null; image: string | null }[];
  predictions: { userId: string; matchId: string; predictedWinnerId: number }[];
  results: {
    matchId: string;
    winnerId: number | null;
    score: string | null;
    isCompleted: boolean | null;
  }[];
  media: { userId: string; predictionImageUrl: string | null }[];
}

export async function getLegacyPlayoffRows(
  seasonId: string,
  connection: Connection = database
): Promise<LegacyPlayoffRows> {
  const query = <Row extends Record<string, unknown>>(text: string) =>
    connection.query<Row>(text, [seasonId]).then((result) => result.rows);
  const [members, predictions, results, media] = await Promise.all([
    // Same membership filter as the legacy playoffs leaderboard (status <> 'inactive').
    query<{ user_id: string; name: string | null; icon: string | null }>(
      `SELECT user_id, name, icon FROM user_seasons
       WHERE season_id = $1 AND status <> 'inactive' ORDER BY name, user_id`
    ),
    query<{ user_id: string; match_id: string; predicted_winner_id: number }>(
      `SELECT user_id, match_id, predicted_winner_id FROM playoff_predictions
       WHERE season_id = $1 AND user_id IS NOT NULL AND match_id IS NOT NULL
         AND predicted_winner_id IS NOT NULL`
    ),
    query<{
      match_id: string;
      winner_id: number | null;
      score: string | null;
      is_completed: boolean | null;
    }>(
      `SELECT match_id, winner_id, score, is_completed FROM playoff_results
       WHERE season_id = $1 AND match_id IS NOT NULL`
    ),
    query<{ user_id: string; prediction_image_url: string | null }>(
      `SELECT user_id, prediction_image_url FROM user_playoff_media
       WHERE season_id = $1 AND user_id IS NOT NULL`
    ),
  ]);
  return {
    members: members.map((row) => ({ userId: row.user_id, name: row.name, image: row.icon })),
    predictions: predictions.map((row) => ({
      userId: row.user_id,
      matchId: row.match_id,
      predictedWinnerId: row.predicted_winner_id,
    })),
    results: results.map((row) => ({
      matchId: row.match_id,
      winnerId: row.winner_id,
      score: row.score,
      isCompleted: row.is_completed,
    })),
    media: media.map((row) => ({
      userId: row.user_id,
      predictionImageUrl: row.prediction_image_url,
    })),
  };
}
