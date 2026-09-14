import type { OfficialScheduleGame, OfficialStanding } from '../../../api/euroleague/types';
import type { DbClient } from '../matches';
import { jsonPayload, type Queryable } from './shared';

export function prepareOfficialCalendarMutations(db: DbClient, seasonId: string) {
  return {
    upsertScheduleGame: async (game: OfficialScheduleGame, client: Queryable = db) => {
      await client.query(
        `UPDATE matches SET
           date = COALESCE($3, matches.date),
           status = CASE
             WHEN matches.status IN ('live', 'finished') THEN matches.status
             WHEN $4 THEN 'finished'
             ELSE 'scheduled'
           END
         WHERE season_id = $1 AND official_game_code = $2`,
        [seasonId, game.gameCode, game.scheduledAt, game.isPlayed]
      );
    },

    upsertStanding: async (standing: OfficialStanding) => {
      await db.query(
        `INSERT INTO official_team_standings (
           season_id, round_number, team_code, position, games_played, games_won,
           games_lost, points_for, points_against, raw_payload, synced_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,NOW())
         ON CONFLICT (season_id, round_number, team_code) DO UPDATE SET
           position=EXCLUDED.position, games_played=EXCLUDED.games_played,
           games_won=EXCLUDED.games_won, games_lost=EXCLUDED.games_lost,
           points_for=EXCLUDED.points_for, points_against=EXCLUDED.points_against,
           raw_payload=EXCLUDED.raw_payload, synced_at=NOW()`,
        [
          seasonId,
          standing.roundNumber,
          standing.teamCode,
          standing.position,
          standing.gamesPlayed,
          standing.gamesWon,
          standing.gamesLost,
          standing.pointsFor,
          standing.pointsAgainst,
          jsonPayload(standing.raw),
        ]
      );
    },
  };
}
