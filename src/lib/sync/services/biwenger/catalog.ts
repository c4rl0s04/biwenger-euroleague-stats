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

export function historicalPriceDate(
  value: unknown,
  startsAt: string | null,
  endsAt: string | null
): string | null {
  const validDate = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date;
  if (!startsAt || !validDate(startsAt) || (endsAt && !validDate(endsAt))) return null;
  const raw = String(value);
  if (!/^\d{6}$/.test(raw)) return null;
  const date = `20${raw.slice(0, 2)}-${raw.slice(2, 4)}-${raw.slice(4, 6)}`;
  if (!validDate(date) || date < startsAt || (endsAt && date > endsAt)) return null;
  return date;
}

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

export interface CanonicalBiwengerPlayerSnapshot {
  id: number;
  name: string;
  teamId: number | null;
  position: string | null;
  points: number | null;
  pointsHome: number | null;
  pointsAway: number | null;
  playedHome: number | null;
  playedAway: number | null;
  gamesPlayed: number | null;
  pointsLastSeason: number | null;
  status: string | null;
  priceIncrement: number | null;
  price: number | null;
  img: string | null;
}

export function parseBiwengerNumeric(
  val: unknown,
  fieldName: string,
  playerId: number | string
): number | null {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') {
      return null;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      throw new Error(
        `Malformed numeric value for ${fieldName} on player ${playerId}: ${JSON.stringify(val)}`
      );
    }
    return n;
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new Error(`Malformed numeric value for ${fieldName} on player ${playerId}: ${val}`);
    }
    return val;
  }
  throw new Error(
    `Malformed numeric value for ${fieldName} on player ${playerId}: ${JSON.stringify(val)}`
  );
}

export function normalizeBiwengerPlayer(
  rawId: string | number,
  raw: any,
  positions: Record<string | number, string> = {}
): CanonicalBiwengerPlayerSnapshot {
  const id = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10);
  if (!id || !Number.isFinite(id) || id <= 0) {
    throw new Error(`Invalid player id: ${JSON.stringify(rawId)}`);
  }
  if (!raw || typeof raw !== 'object') {
    throw new Error(`Invalid player raw payload for player ${id}`);
  }
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    throw new Error(`Missing required player name for player ${id}`);
  }

  const playedHome = parseBiwengerNumeric(raw.playedHome, 'playedHome', id);
  const playedAway = parseBiwengerNumeric(raw.playedAway, 'playedAway', id);
  let gamesPlayed: number | null = null;
  if (playedHome != null || playedAway != null) {
    gamesPlayed = (playedHome ?? 0) + (playedAway ?? 0);
  }

  const rawPos = raw.position != null ? positions[raw.position] : null;

  return {
    id,
    name,
    teamId: parseBiwengerNumeric(raw.teamID ?? raw.team_id, 'teamID', id),
    position: rawPos != null && rawPos.trim() !== '' ? rawPos.trim() : null,
    points: parseBiwengerNumeric(raw.points, 'points', id),
    pointsHome: parseBiwengerNumeric(raw.pointsHome, 'pointsHome', id),
    pointsAway: parseBiwengerNumeric(raw.pointsAway, 'pointsAway', id),
    playedHome,
    playedAway,
    gamesPlayed,
    pointsLastSeason: parseBiwengerNumeric(raw.pointsLastSeason, 'pointsLastSeason', id),
    status:
      raw.status != null && String(raw.status).trim() !== '' ? String(raw.status).trim() : null,
    priceIncrement: parseBiwengerNumeric(raw.priceIncrement, 'priceIncrement', id),
    price: parseBiwengerNumeric(raw.price, 'price', id),
    img: raw.img ? String(raw.img) : null,
  };
}

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

  manager.log('Fetching players database');
  const competition = await deps.fetchAllPlayers();
  const snapshot = manager.setBiwengerCompetition(competition);
  const playersList = snapshot.players;

  const firstRound = relevantRounds(snapshot.rounds)[0];
  if (!firstRound) throw new Error('Biwenger competition contains no syncable rounds.');
  const firstRoundResponse = await deps.fetchRoundGames(firstRound.id);
  const firstRoundGames = firstRoundResponse?.data?.games || firstRoundResponse?.games || [];
  const readiness = validateBiwengerRoundSeason({ seasonId, games: firstRoundGames });
  manager.log(
    `Biwenger season readiness: ${readiness.datedGames}/${readiness.games} first-round games belong to ${readiness.seasonYear}`
  );

  manager.log(
    `Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`
  );

  const mutations = preparePlayerMutations(db as any, { seasonId });
  const boundaries = await db!.query(
    'SELECT starts_at::text, ends_at::text FROM seasons WHERE id = $1',
    [seasonId]
  );
  const startsAt = boundaries.rows[0]?.starts_at ?? null;
  const endsAt = boundaries.rows[0]?.ends_at ?? null;
  const positions: any = CONFIG.POSITIONS;
  const teams = snapshot.teams;

  const existingSeasonPlayerMap = await getExistingPlayerSeasonMap(seasonId, db);
  const existingPlayerIds = await getExistingPlayerIdentities(db);
  manager.log(`Found ${existingPlayerIds.size} existing player identities in DB`);
  manager.log(`Found ${existingSeasonPlayerMap.size} existing player season rows for ${seasonId}`);

  manager.log('Syncing teams');
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
  let skippedHistoricalPrices = 0;
  if (!startsAt) warnings.push('Historical price import disabled: season starts_at is missing.');

  for (const [id, player] of Object.entries(playersList) as any[]) {
    const snapshot = normalizeBiwengerPlayer(id, player, positions);
    const playerId = snapshot.id;

    await mutations.upsertPlayer({
      id: playerId,
      name: snapshot.name,
      team_id: snapshot.teamId,
      position: snapshot.position,
      puntos: snapshot.points,
      partidos_jugados: snapshot.gamesPlayed,
      played_home: snapshot.playedHome,
      played_away: snapshot.playedAway,
      points_home: snapshot.pointsHome,
      points_away: snapshot.pointsAway,
      points_last_season: snapshot.pointsLastSeason,
      status: snapshot.status,
      price_increment: snapshot.priceIncrement,
      price: snapshot.price,
      img: snapshot.img,
    });

    if (snapshot.price != null) {
      const todayInt = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const priceDate = parsePriceDate(todayInt);

      await mutations.insertMarketValue({
        player_id: playerId,
        price: snapshot.price,
        date: priceDate,
      });
    }

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
              const dateStr = historicalPriceDate(dateInt, startsAt, endsAt);
              if (!dateStr) {
                skippedHistoricalPrices++;
                continue;
              }
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

  manager.log(`New players detected: ${newPlayersCount} (fetched full details)`);
  if (skippedHistoricalPrices > 0) {
    warnings.push(
      `Skipped ${skippedHistoricalPrices} historical prices with invalid or out-of-season dates.`
    );
  }
  manager.log(`Existing players: ${skippedDetailsCount} (skipped details fetch, updated price)`);

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
