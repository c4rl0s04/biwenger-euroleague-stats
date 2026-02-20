import { fetchAllPlayers, fetchPlayerDetails } from '../../api/biwenger-client';
import { getShortTeamName } from '../../utils/format';
import { CONFIG } from '../../config';
import { preparePlayerMutations } from '../../db/mutations/players';
import { SyncManager } from '../manager';

const SLEEP_MS = 600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseBiwengerDate = (dateInt: number | string | null | undefined): string | null => {
  if (!dateInt) return null;
  const str = dateInt.toString();
  if (str.length !== 8) return null;
  const year = str.substring(0, 4);
  const month = str.substring(4, 6);
  const day = str.substring(6, 8);
  return `${year}-${month}-${day}`;
};

const parsePriceDate = (dateInt: number | string): string => {
  const str = dateInt.toString();
  let year = '20' + str.substring(0, 2);
  let month = str.substring(2, 4);
  let day = str.substring(4, 6);

  if (parseInt(month) > 12) {
    const temp = month;
    month = day;
    day = temp;
  }

  if (parseInt(month) > 12) {
    console.warn(`Invalid date encountered: ${dateInt}. Defaulting to ${year}-01-01`);
    return `${year}-01-01`;
  }

  return `${year}-${month}-${day}`;
};

export async function run(manager: SyncManager) {
  const db = manager.context.db;
  manager.log('\n📥 Fetching Players Database...');
  const competition = await fetchAllPlayers();

  const rounds = competition.data.rounds || competition.data.season?.rounds || [];
  if (rounds.length > 0) {
    manager.log('   🔄 Building Canonical Round Map...');
    for (const r of rounds) {
      const baseName = manager.normalizeRoundName(r.name);
      if (!manager.roundNameMap.has(baseName) || r.id < manager.roundNameMap.get(baseName)!) {
        manager.roundNameMap.set(baseName, r.id);
      }
    }
    manager.log(
      `      Found ${manager.roundNameMap.size} unique rounds from ${rounds.length} total.`
    );
  }

  const playersList = competition.data.data
    ? competition.data.data.players
    : competition.data.players;

  if (!playersList) {
    throw new Error('Could not find players list in competition data');
  }

  manager.log(
    `Found ${Object.keys(playersList).length} players. Updating DB and fetching details...`
  );

  manager.context.competition = competition;
  manager.context.playersList = playersList;
  manager.context.teams =
    (competition.data.data ? competition.data.data.teams : competition.data.teams) || {};

  const mutations = preparePlayerMutations(db as any);
  const positions: any = CONFIG.POSITIONS;
  const teams = manager.context.teams;

  const resExisting = await (db as any).query('SELECT id, puntos, points_home, points_away FROM players');
  const existingPlayerMap = new Map(resExisting.rows.map((p: any) => [p.id, p]));
  const existingPlayerIds = new Set(resExisting.rows.map((p: any) => p.id));
  manager.log(`   ℹ️ Found ${existingPlayerIds.size} existing players in DB.`);

  manager.log('Syncing Teams...');
  for (const [teamId, teamData] of Object.entries(teams) as any[]) {
    await mutations.upsertTeam({
      id: parseInt(teamId),
      name: teamData.name,
      short_name: getShortTeamName(teamData.name),
      img: teamData.img || `https://cdn.biwenger.com/teams/${teamId}.png`,
    });
  }

  let newPlayersCount = 0;
  let skippedDetailsCount = 0;

  for (const [id, player] of Object.entries(playersList) as any[]) {
    const playerId = parseInt(id);
    const existing = existingPlayerMap.get(playerId);

    let finalPoints = player.points || 0;
    let finalPointsHome = player.pointsHome || 0;
    let finalPointsAway = player.pointsAway || 0;

    if (existing) {
      if (finalPoints === 0 && (existing as any).puntos > 0) {
        finalPoints = (existing as any).puntos;
      }
      if (finalPointsHome === 0 && (existing as any).points_home > 0) {
        finalPointsHome = (existing as any).points_home;
      }
      if (finalPointsAway === 0 && (existing as any).points_away > 0) {
        finalPointsAway = (existing as any).points_away;
      }
    }

    await mutations.upsertPlayer({
      id: playerId,
      name: player.name,
      team_id: player.teamID,
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
      img: player.img || null,
    });

    const todayInt = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const priceDate = parsePriceDate(todayInt);

    await mutations.insertMarketValue({
      player_id: playerId,
      price: player.price || 0,
      date: priceDate,
    });

    const isNewPlayer = !existingPlayerIds.has(playerId);

    if (isNewPlayer) {
      try {
        await sleep(SLEEP_MS);
        newPlayersCount++;

        const lookupId = player.slug || player.id || playerId;
        const details = await fetchPlayerDetails(lookupId);

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
        manager.error(
          `   ⚠️ Error fetching details for NEW player ${player.name} (${lookupId}): ${e.message}`
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
    success: true,
    message: `Players synced. (${Object.keys(teams).length} teams, ${Object.keys(playersList).length} players)`,
    data: competition,
  };
}

export const syncPlayers = async (db: any, options: any) => {
  const mockManager = {
    context: { db, playersList: {}, teams: {} },
    log: console.log,
    error: console.error,
  } as unknown as SyncManager;
  const result = await run(mockManager);
  return result.data;
};
