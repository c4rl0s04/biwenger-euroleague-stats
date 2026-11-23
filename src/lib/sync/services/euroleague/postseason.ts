import { euroleagueSeasonYear } from '../../../api/euroleague/normalization';
import { parseOfficialPhase } from '../../../api/euroleague/phase';
import { prepareOfficialCalendarMutations } from '../../../db/mutations/official/calendar';
import type { SyncManager } from '../../manager';

/**
 * Stores every official game with its phase and fills postseason final scores from the
 * game report. Idempotent: unchanged rows and already-scored games are not rewritten.
 */
export async function syncOfficialPostseason(manager: SyncManager) {
  const seasonCode = manager.context.season?.euroleagueCode;
  if (!seasonCode) throw new Error('EUROLEAGUE_SEASON_CODE is required.');
  const seasonId = manager.context.season?.seasonId || manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const seasonYear = euroleagueSeasonYear(seasonCode, seasonId);
  const provider = manager.context.euroleague;
  const calendar = prepareOfficialCalendarMutations(manager.context.db as any, seasonId);

  const schedule = manager.context.officialSchedule ?? (await provider.getSchedule(seasonYear));
  if (schedule.length === 0) throw new Error(`Official schedule for ${seasonYear} is empty.`);

  // Classify everything before writing so an unknown phase code fails without partial writes.
  const classified = schedule.map((game) => ({
    game,
    phase: parseOfficialPhase(game.roundCode, game.phase),
  }));

  let changed = 0;
  for (const { game, phase } of classified) {
    if (await calendar.upsertOfficialScheduleGame(game, phase)) changed++;
  }

  const scheduleByCode = new Map(schedule.map((game) => [game.gameCode, game]));
  const pending = await calendar.getUnscoredPostseasonGameCodes();
  let scored = 0;
  let unavailable = 0;
  for (const gameCode of pending) {
    const report = await provider.getGameReport(seasonYear, gameCode);
    if (!report?.isPlayed || report.homeScore == null || report.awayScore == null) {
      unavailable++;
      continue;
    }
    const game = scheduleByCode.get(gameCode);
    if (
      game &&
      (report.homeTeamCode !== game.homeTeamCode || report.awayTeamCode !== game.awayTeamCode)
    ) {
      throw new Error(`Official game ${gameCode} report teams do not match the schedule.`);
    }
    if (await calendar.setOfficialScheduleGameScore(gameCode, report.homeScore, report.awayScore)) {
      scored++;
    }
  }

  const phases = { RS: 0, PI: 0, PO: 0, FF: 0 };
  for (const { phase } of classified) phases[phase]++;
  return { games: schedule.length, changed, ...phases, scored, unavailable };
}
