import type { SyncManager } from '../manager';
import { relevantRounds, type BiwengerRound } from '../rounds';
import * as lineups from '../services/biwenger/lineups';

async function liveRounds(manager: SyncManager): Promise<BiwengerRound[]> {
  const seasonId = manager.context.seasonId;
  const result = await (manager.context.db as any).query(
    `SELECT DISTINCT round_id AS id, round_name AS name, 'active' AS status
     FROM matches
     WHERE season_id=$1 AND official_game_code IS NOT NULL
       AND status <> 'finished'
       AND date BETWEEN NOW()-INTERVAL '5 hours' AND NOW()+INTERVAL '1 hour'
     ORDER BY id`,
    [seasonId]
  );
  return result.rows;
}

async function playerMap(manager: SyncManager): Promise<Record<string, any>> {
  if (manager.context.biwenger) return manager.context.biwenger.players;
  const result = await (manager.context.db as any).query('SELECT id, name FROM players');
  return Object.fromEntries(result.rows.map((player: any) => [player.id, player]));
}

export async function run(manager: SyncManager) {
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');

  const rounds =
    manager.mode === 'live'
      ? await liveRounds(manager)
      : relevantRounds((await manager.getBiwengerCompetition()).rounds);
  const players = await playerMap(manager);
  let inserted = 0;
  let synchronizedRounds = 0;

  for (const round of rounds) {
    const roundId = manager.resolveRoundId(round);
    const state = await (manager.context.db as any).query(
      `SELECT MAX(date) AS last_match_date, MIN(date) AS first_match_date,
              BOOL_AND(status = 'finished') AS all_finished, COUNT(*)::int AS match_count,
              EXISTS(
                SELECT 1 FROM lineups l WHERE l.season_id=$2 AND l.round_id=$1
              ) AS has_lineups
       FROM matches
       WHERE season_id=$2 AND round_id=$1`,
      [roundId, seasonId]
    );
    const row = state.rows[0];
    const now = new Date();

    if (manager.mode === 'live' && row?.has_lineups) continue;
    if (manager.mode === 'routine' && row?.match_count > 0) {
      const lastMatch = row.last_match_date ? new Date(row.last_match_date).getTime() : 0;
      if (row.all_finished && now.getTime() - lastMatch >= 24 * 60 * 60 * 1000) continue;
      if (row.first_match_date && new Date(row.first_match_date) > now) continue;
    }

    const result = await lineups.run(manager, { ...round, id: roundId }, players);
    inserted += result.insertedCount || 0;
    synchronizedRounds++;
  }

  return {
    summary: 'Biwenger lineups and manager round results synchronized.',
    counts: { rounds: synchronizedRounds, lineups: inserted },
  };
}
