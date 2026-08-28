import type { DbClient } from './matches';

export function preparePlayerStatMutations(db: DbClient, seasonId: string) {
  return {
    updateFantasyPoints: async (input: {
      playerId: number;
      roundId: number;
      fantasyPoints: number;
    }) => {
      await db.query(
        `INSERT INTO player_round_stats (season_id, player_id, round_id, fantasy_points)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT(season_id, player_id, round_id) DO UPDATE SET
           fantasy_points = EXCLUDED.fantasy_points`,
        [seasonId, input.playerId, input.roundId, input.fantasyPoints]
      );
    },
  };
}
