import { CONFIG } from '../../../config';
import { euroleagueSeasonYear } from '../../../api/euroleague/normalization';
import type { EuroleagueScheduleGame } from '../../../api/euroleague/types';
import { prepareOfficialCalendarMutations } from '../../../db/mutations/official/calendar';
import { prepareOfficialMappingMutations } from '../../../db/mutations/official/mappings';
import { fillMissingOfficialPlayerBiographies } from '../../../db/mutations/official/player-biographies';
import type { SyncManager } from '../../manager';
import { validateAdvancedProviderSnapshot } from '../../preflight';
import { reconcilePlayerMappings, reconcileTeamMappings } from './mappings';

// The standings endpoint 404s for play-in/playoff/Final Four gamedays, so only RS gamedays count.
export function regularSeasonStandingsRound(schedule: EuroleagueScheduleGame[]) {
  return Math.max(
    1,
    ...schedule
      .filter((game) => game.isPlayed && game.roundCode === 'RS' && game.roundNumber != null)
      .map((game) => game.roundNumber as number)
  );
}

export async function syncOfficialMasterData(manager: SyncManager) {
  const seasonCode = manager.context.season?.euroleagueCode;
  if (!seasonCode) throw new Error('EUROLEAGUE_SEASON_CODE is required.');
  const seasonId = manager.context.season?.seasonId || manager.context.seasonId;
  if (!seasonId) throw new Error('The writable season was not resolved.');
  const seasonYear = euroleagueSeasonYear(seasonCode, seasonId);
  const provider = manager.context.euroleague;
  const calendar = prepareOfficialCalendarMutations(manager.context.db as any, seasonId);
  const mappings = prepareOfficialMappingMutations(manager.context.db as any, seasonId);

  const [schedule, profiles] = await Promise.all([
    provider.getSchedule(seasonYear),
    provider.getPlayerProfiles(seasonYear),
  ]);
  if (schedule.length === 0) throw new Error(`Official schedule for ${seasonYear} is empty.`);
  manager.context.officialSchedule = schedule;
  const standingsRound = regularSeasonStandingsRound(schedule);
  const standings = await provider.getStandings(seasonYear, standingsRound);
  validateAdvancedProviderSnapshot({
    seasonYear,
    expectedSeasonId: seasonId,
    schedule,
    standings,
  });

  const preview = manager.previewPlayerMappings;
  if (!preview) {
    for (const game of schedule) {
      await calendar.upsertScheduleGame(game);
    }
    for (const standing of standings) await calendar.upsertStanding(standing);
  }

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

  const teamResult = await reconcileTeamMappings(
    mappings,
    Array.from(teamSource.values()),
    preview
  );
  let teams: Map<number, string> | undefined;
  if (preview) {
    const projected = new Map(
      (await mappings.getTeamMappings()).map((row) => [row.provider_team_code, row.team_id])
    );
    teamResult.assignments.forEach((id, code) => projected.set(code, id));
    teams = new Map(Array.from(projected, ([code, id]) => [id, code]));
    if (teams.size !== projected.size) throw new Error('Conflicting official team mappings');
  }
  const playerResult = await reconcilePlayerMappings(mappings, profiles, {
    allowSurname: true,
    preview,
    teams,
  });
  const completedBiographies = preview
    ? 0
    : await fillMissingOfficialPlayerBiographies(manager.context.db as any, seasonId);
  if (preview) {
    for (const {
      providerCode,
      playerId,
      teamCode,
      name,
      method,
      reason,
    } of playerResult.decisions) {
      manager.log(
        `${providerCode} ${name} [${teamCode ?? 'no team'}]: ${playerId ?? 'pending'} (${playerId === null ? reason : method})`
      );
    }
  }
  const persistedPlayerMappings = await mappings.getPlayerMappings();
  const pendingCodes = new Set(
    persistedPlayerMappings
      .filter((mapping) => mapping.status === 'review_required')
      .map((mapping) => mapping.provider_player_code)
  );
  if (preview) {
    for (const { providerCode, playerId } of playerResult.decisions) {
      if (playerId === null) pendingCodes.add(providerCode);
      else pendingCodes.delete(providerCode);
    }
  }
  const pendingPlayers = pendingCodes.size;
  const mappingIssues = [...teamResult.issues, ...playerResult.issues];

  manager.log(
    `Official master data: ${schedule.length} games, ${teamResult.mapped}/${teamSource.size} teams, ${playerResult.mapped}/${profiles.length} player profiles mapped, ${pendingPlayers} player reviews ${preview ? 'projected' : 'persisted'}`
  );
  for (const issue of mappingIssues) {
    const suggestion = issue.suggestion
      ? `; suggestion only: ${issue.suggestion.name} (${issue.suggestion.score.toFixed(2)})`
      : '';
    (manager.warn || manager.log).call(
      manager,
      `${issue.kind} review required: ${issue.providerName} (${issue.providerCode})${issue.reason ? `: ${issue.reason}` : ''}${suggestion}`
    );
  }

  return {
    schedule: schedule.length,
    standings: standings.length,
    profiles: profiles.length,
    mappedTeams: teamResult.mapped,
    mappedPlayers: playerResult.mapped,
    completedBiographies,
    pendingPlayers,
    issues: teamResult.issues.length + pendingPlayers,
  };
}
