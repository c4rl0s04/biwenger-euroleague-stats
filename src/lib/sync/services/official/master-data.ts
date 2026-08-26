import { CONFIG } from '../../../config';
import { getOfficialBasketballProvider } from '../../../api/official-provider-factory';
import { officialSeasonYear } from '../../../api/official-provider';
import { prepareOfficialMutations } from '../../../db/mutations/official';
import type { SyncManager } from '../../manager';
import { reconcilePlayerMappings, reconcileTeamMappings } from './mapping';

export async function syncOfficialMasterData(manager: SyncManager) {
  const seasonCode = CONFIG.EUROLEAGUE.SEASON_CODE;
  if (!seasonCode) throw new Error('EUROLEAGUE_SEASON_CODE is required.');
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const seasonYear = officialSeasonYear(seasonCode, seasonId);
  const provider = await getOfficialBasketballProvider();
  const mutations = prepareOfficialMutations(manager.context.db as any, seasonId);

  const [schedule, profiles] = await Promise.all([
    provider.getSchedule(seasonYear),
    provider.getPlayerProfiles(seasonYear),
  ]);
  if (schedule.length === 0) throw new Error(`Official schedule for ${seasonYear} is empty.`);
  const standingsRound = Math.max(
    1,
    ...schedule
      .filter((game) => game.isPlayed && game.roundNumber != null)
      .map((game) => game.roundNumber as number)
  );
  const standings = await provider.getStandings(seasonYear, standingsRound);

  const codes = new Set<number>();
  for (const game of schedule) {
    if (codes.has(game.gameCode)) throw new Error(`Duplicate official game code ${game.gameCode}.`);
    codes.add(game.gameCode);
    await mutations.upsertScheduleGame(game);
  }
  for (const standing of standings) await mutations.upsertStanding(standing);

  const teamSource = new Map<
    string,
    { code: string; name: string; crestUrl: string | null; raw?: unknown }
  >();
  for (const row of standings) {
    teamSource.set(row.teamCode, {
      code: row.teamCode,
      name: row.teamName,
      crestUrl: row.crestUrl,
      raw: row.raw,
    });
  }
  for (const game of schedule) {
    if (!teamSource.has(game.homeTeamCode)) {
      teamSource.set(game.homeTeamCode, {
        code: game.homeTeamCode,
        name: game.homeTeamName,
        crestUrl: null,
      });
    }
    if (!teamSource.has(game.awayTeamCode)) {
      teamSource.set(game.awayTeamCode, {
        code: game.awayTeamCode,
        name: game.awayTeamName,
        crestUrl: null,
      });
    }
  }

  const teamResult = await reconcileTeamMappings(mutations, Array.from(teamSource.values()));
  const playerResult = await reconcilePlayerMappings(mutations, profiles);
  const persistedPlayerMappings = await mutations.getPlayerMappings();
  const pendingPlayers = persistedPlayerMappings.filter(
    (mapping) => mapping.status === 'review_required'
  ).length;
  manager.context.officialSchedule = schedule;
  manager.context.officialMappingIssues = [...teamResult.issues, ...playerResult.issues];

  manager.log(
    `   ✅ Official master data: ${schedule.length} games, ${teamResult.mapped}/${teamSource.size} teams, ${playerResult.mapped}/${profiles.length} player profiles mapped, ${pendingPlayers} persisted player reviews.`
  );
  for (const issue of manager.context.officialMappingIssues) {
    const suggestion = issue.suggestion
      ? `; suggestion only: ${issue.suggestion.name} (${issue.suggestion.score.toFixed(2)})`
      : '';
    manager.log(
      `   ⚠️ ${issue.kind} review required: ${issue.providerName} (${issue.providerCode})${suggestion}`
    );
  }

  return {
    schedule: schedule.length,
    standings: standings.length,
    profiles: profiles.length,
    mappedTeams: teamResult.mapped,
    mappedPlayers: playerResult.mapped,
    pendingPlayers,
    issues: teamResult.issues.length + pendingPlayers,
  };
}
