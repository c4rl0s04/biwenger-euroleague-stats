import { SyncManager } from '../manager';
import { syncOfficialMasterData } from '../services/euroleague/master-data';

/** Imports official season master data without mutating historical global identities. */
export async function run(manager: SyncManager) {
  manager.log('\n🌍 Syncing official EuroLeague master data...');
  const result = await syncOfficialMasterData(manager);
  return {
    summary: `Imported official master data; ${result.issues} mappings need review.`,
    counts: {
      games: result.schedule,
      standings: result.standings,
      profiles: result.profiles,
      mappedTeams: result.mappedTeams,
      mappedPlayers: result.mappedPlayers,
      pendingPlayers: result.pendingPlayers,
    },
  };
}
