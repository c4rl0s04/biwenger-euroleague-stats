import type { OfficialPhase } from '../../../api/euroleague/phase';
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
           END,
           arena_code = COALESCE($5, matches.arena_code),
           arena_name = COALESCE($6, matches.arena_name),
           arena_capacity = COALESCE($7, matches.arena_capacity)
         WHERE season_id = $1 AND official_game_code = $2`,
        [
          seasonId,
          game.gameCode,
          game.scheduledAt?.toISOString() ?? null,
          game.isPlayed,
          game.arenaCode ?? null,
          game.arenaName ?? null,
          game.arenaCapacity ?? null,
        ]
      );
    },

    /** Stores the official game with its phase; returns true only when the row changed. */
    upsertOfficialScheduleGame: async (
      game: OfficialScheduleGame,
      phaseCode: OfficialPhase
    ): Promise<boolean> => {
      const result = await db.query(
        `INSERT INTO official_schedule_games (
           season_id, game_code, phase_code, round_code, round_number,
           home_team_code, away_team_code, scheduled_at, is_played, synced_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (season_id, game_code) DO UPDATE SET
           phase_code=EXCLUDED.phase_code, round_code=EXCLUDED.round_code,
           round_number=EXCLUDED.round_number, home_team_code=EXCLUDED.home_team_code,
           away_team_code=EXCLUDED.away_team_code, scheduled_at=EXCLUDED.scheduled_at,
           is_played=EXCLUDED.is_played, synced_at=NOW()
         WHERE (official_schedule_games.phase_code, official_schedule_games.round_code,
                official_schedule_games.round_number, official_schedule_games.home_team_code,
                official_schedule_games.away_team_code, official_schedule_games.scheduled_at,
                official_schedule_games.is_played)
           IS DISTINCT FROM
               (EXCLUDED.phase_code, EXCLUDED.round_code, EXCLUDED.round_number,
                EXCLUDED.home_team_code, EXCLUDED.away_team_code, EXCLUDED.scheduled_at,
                EXCLUDED.is_played)`,
        [
          seasonId,
          game.gameCode,
          phaseCode,
          // The schedule `group` (e.g. "PLAYOFF A") identifies the tie; `round` is already phase_code.
          game.phase?.trim() || null,
          game.roundNumber,
          game.homeTeamCode,
          game.awayTeamCode,
          game.scheduledAt?.toISOString() ?? null,
          game.isPlayed,
        ]
      );
      return (result.rowCount ?? 0) > 0;
    },

    /** Played postseason games whose final score has not been stored yet. */
    getUnscoredPostseasonGameCodes: async (): Promise<number[]> => {
      const result = await db.query(
        `SELECT game_code FROM official_schedule_games
         WHERE season_id = $1 AND phase_code <> 'RS' AND is_played
           AND (home_score IS NULL OR away_score IS NULL)
         ORDER BY game_code`,
        [seasonId]
      );
      return result.rows.map((row: { game_code: number }) => Number(row.game_code));
    },

    setOfficialScheduleGameScore: async (
      gameCode: number,
      homeScore: number,
      awayScore: number
    ): Promise<boolean> => {
      const result = await db.query(
        `UPDATE official_schedule_games
         SET home_score = $3, away_score = $4, synced_at = NOW()
         WHERE season_id = $1 AND game_code = $2
           AND (home_score, away_score) IS DISTINCT FROM ($3::int, $4::int)`,
        [seasonId, gameCode, homeScore, awayScore]
      );
      return (result.rowCount ?? 0) > 0;
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
