import type { OfficialScheduleGame, OfficialStanding } from '../../../api/euroleague/types';
import type { DbClient } from '../matches';
import { jsonPayload, type Queryable } from './shared';

export function prepareOfficialCalendarMutations(db: DbClient, seasonId: string) {
  return {
    upsertScheduleGame: async (game: OfficialScheduleGame, client: Queryable = db) => {
      await client.query(
        `INSERT INTO official_games (
           season_id, provider, game_code, game_id, round_number, round_code, phase,
           home_team_code, away_team_code, scheduled_at, is_date_confirmed,
           is_time_confirmed, is_played, status, arena_code, arena_name, arena_capacity,
           raw_schedule, synced_at
         ) VALUES (
           $1, 'euroleague_advanced', $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11, $12, $13, $14, $15, $16, $17::jsonb, NOW()
         )
         ON CONFLICT (season_id, provider, game_code) DO UPDATE SET
           game_id=EXCLUDED.game_id, round_number=EXCLUDED.round_number,
           round_code=EXCLUDED.round_code, phase=EXCLUDED.phase,
           home_team_code=EXCLUDED.home_team_code, away_team_code=EXCLUDED.away_team_code,
           scheduled_at=EXCLUDED.scheduled_at, is_date_confirmed=EXCLUDED.is_date_confirmed,
           is_time_confirmed=EXCLUDED.is_time_confirmed, is_played=EXCLUDED.is_played,
           status=CASE
             WHEN official_games.status IN ('live','finished') THEN official_games.status
             WHEN EXCLUDED.is_played THEN 'finished'
             ELSE 'scheduled'
           END,
           arena_code=EXCLUDED.arena_code,
           arena_name=COALESCE(EXCLUDED.arena_name,official_games.arena_name),
           arena_capacity=COALESCE(EXCLUDED.arena_capacity,official_games.arena_capacity),
           raw_schedule=EXCLUDED.raw_schedule, synced_at=NOW()`,
        [
          seasonId,
          game.gameCode,
          game.gameId,
          game.roundNumber,
          game.roundCode,
          game.phase,
          game.homeTeamCode,
          game.awayTeamCode,
          game.scheduledAt,
          game.isDateConfirmed,
          game.isTimeConfirmed,
          game.isPlayed,
          game.isPlayed ? 'finished' : 'scheduled',
          game.arenaCode,
          game.arenaName,
          game.arenaCapacity,
          jsonPayload(game.raw),
        ]
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
