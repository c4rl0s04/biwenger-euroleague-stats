import { fetchAllPlayers, fetchPlayerDetails, fetchRoundGames } from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { preparePlayerMutations } from '../../../db/mutations/players';
import { getShortTeamName } from '../../../utils/format';
import type { SyncManager } from '../../manager';
import { validateBiwengerRoundSeason } from '../../preflight';
import {
  getExistingPlayerIdentities,
  getExistingPlayerSeasonMap,
} from '../../repositories/sync-queries';
import { relevantRounds } from '../../rounds';

const DEFAULT_SLEEP_MS = 600;

export interface BiwengerCatalogDependencies {
  fetchAllPlayers: typeof fetchAllPlayers;
  fetchRoundGames: typeof fetchRoundGames;
  fetchPlayerDetails: typeof fetchPlayerDetails;
  sleep: (ms: number) => Promise<void>;
}

const defaultDependencies: BiwengerCatalogDependencies = {
  fetchAllPlayers,
  fetchRoundGames,
  fetchPlayerDetails,
  sleep: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};

export const parseBiwengerDate = (dateInt: number | string | null | undefined): string | null => {
  if (!dateInt) return null;
  const str = dateInt.toString();
  if (str.length !== 8) return null;
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  return `${year}-${month}-${day}`;
};

export const parsePriceDate = (dateInt: number | string): string => {
  const str = dateInt.toString();
  const year = '20' + str.substring(0, 2);
  let month = str.substring(2, 4);
  let day = str.substring(4, 6);

  if (parseInt(month, 10) > 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  if (parseInt(month, 10) > 12) {
    console.warn(`Invalid date encountered: ${dateInt}. Defaulting to ${year}-01-01`);
    return `${year}-01-01`;
  }

  return `${year}-${month}-${day}`;
};

export interface BiwengerCatalogSyncResult {
  summary: string;
  counts: {
    teams: number;
    players: number;
    rounds: number;
    newPlayers: number;
  };
  warnings: string[];
}

export async function syncBiwengerCatalog(
  manager: SyncManager,
  overrides?: Partial<BiwengerCatalogDependencies>
): Promise<BiwengerCatalogSyncResult> {
  const deps = { ...defaultDependencies, ...overrides };
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('Canonical sync season was not resolved before catalogue import.');

  manager.log('\n📥 Fetching Players Database...');
  const competition = await deps.fetchAllPlayers();
  const snapshot = manager.setBiwengerCompetition(competition);
  const playersList = snapshot.players;

  const firstRound = relevantRounds(snapshot.rounds)[0];
  if (!firstRound) throw new Error('Biwenger competition contains no syncable rounds.');
  const firstRoundResponse = await deps.fetchRoundGames(firstRound.id);
  const firstRoundGames = firstRoundResponse?.data?.games || firstRoundResponse?.games || [];
  const readiness = validateBiwengerRoundSeason({ seasonId, games: firstRoundGames });
  manager.log(
    `   ✅ Biwenger season readiness: ${readiness.datedGames}/${readiness.games} first-round games belong to ${readiness.seasonYear}.`
  );

  manager.log(
    `Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`
  );

  const mutations = preparePlayerMutations(db as any, { seasonId });
  const positions: any = CONFIG.POSITIONS;
  const teams = snapshot.teams;

  const existingSeasonPlayerMap = await getExistingPlayerSeasonMap(seasonId, db);
  const existingPlayerIds = await getExistingPlayerIdentities(db);
  manager.log(`   ℹ️ Found ${existingPlayerIds.size} existing player identities in DB.`);
  manager.log(
    `   ℹ️ Found ${existingSeasonPlayerMap.size} existing player season rows for ${seasonId}.`
  );

  manager.log('Syncing Teams...');
  for (const [teamId, teamData] of Object.entries(teams) as any[]) {
    await mutations.upsertTeam({
      id: parseInt(teamId, 10),
      name: teamData.name,
      short_name: getShortTeamName(teamData.name),
      img: teamData.img || `https://cdn.biwenger.com/teams/${teamId}.png`,
    });
  }

  let newPlayersCount = 0;
  let skippedDetailsCount = 0;
  const warnings: string[] = [];

  for (const [id, player] of Object.entries(playersList) as any[]) {
    const playerId = parseInt(id, 10);
    const existing = existingSeasonPlayerMap.get(playerId);

    let finalPoints = player.points || 0;
    let finalPointsHome = player.pointsHome || 0;
    let finalPointsAway = player.pointsAway || 0;

    if (existing) {
      if (finalPoints === 0 && existing.puntos > 0) {
        finalPoints = existing.puntos;
      }
      const homePts = existing.pointsHome ?? (existing as any).points_home ?? 0;
      if (finalPointsHome === 0 && homePts > 0) {
        finalPointsHome = homePts;
      }
      const awayPts = existing.pointsAway ?? (existing as any).points_away ?? 0;
      if (finalPointsAway === 0 && awayPts > 0) {
        finalPointsAway = awayPts;
      }
    }

    await mutations.upsertPlayer({
      id: playerId,
      name: player.name,
      team_id: player.teamID ?? null,
      position: positions[player.position] || 'Unknown',
      puntos: finalPoints,
      partidos_jugados: (player.playedHome || 0) + (player.playedAway || 0),
      played_home: player.playedHome || 0,
      played_away: player.playedAway || 0,
      points_home: finalPointsHome,
      points_away: finalPointsAway,
      points_last_season: player.pointsLastSeason || 0,
      status: player.status || 'ok',
      price_increment: player.priceIncrement || 0,
      price: player.price || 0,
      img: player.img ?? null,
    });

    const todayInt = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const priceDate = parsePriceDate(todayInt);

    await mutations.insertMarketValue({
      player_id: playerId,
      price: player.price || 0,
      date: priceDate,
    });

    const isNewPlayer = !existingPlayerIds.has(playerId);

    if (isNewPlayer) {
      try {
        await deps.sleep(DEFAULT_SLEEP_MS);
        newPlayersCount++;

        const lookupId = player.slug || player.id || playerId;
        const details = await deps.fetchPlayerDetails(lookupId);

        if (details.data) {
          const d = details.data;

          await mutations.updatePlayerDetails({
            id: playerId,
            birth_date: parseBiwengerDate(d.birthday || undefined) || '',
            height: d.height || null,
            weight: d.weight || null,
          });

          if (d.prices && Array.isArray(d.prices)) {
            for (const [dateInt, price] of d.prices) {
              const dateStr = parsePriceDate(dateInt);
              await mutations.insertMarketValue({
                player_id: playerId,
                price: price,
                date: dateStr,
              });
            }
          }
        }
      } catch (e: any) {
        const lookupId = player.slug || playerId;
        warnings.push(
          `Optional details were unavailable for new player ${player.name} (${lookupId}): ${e.message}`
        );
      }
    } else {
      skippedDetailsCount++;
    }
  }

  manager.log(`   ✨ New Players Detected: ${newPlayersCount} (Fetched full details)`);
  manager.log(
    `   ⏩ Existing Players: ${skippedDetailsCount} (Skipped details fetch, updated price)`
  );

  return {
    summary: 'Biwenger player and team catalogue synchronized.',
    counts: {
      teams: Object.keys(teams).length,
      players: Object.keys(playersList).length,
      rounds: snapshot.rounds.length,
      newPlayers: newPlayersCount,
    },
    warnings,
  };
}
