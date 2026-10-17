import { biwengerFetch } from '../../../api/biwenger-client';
import { CONFIG } from '../../../config';
import { prepareMarketMutations, type MarketMutations } from '../../../db/mutations/market';
import type { SyncManager } from '../../manager';
import { getSeasonActiveUserNames, getSeasonStartDate } from '../../repositories/sync-queries';

export interface BoardDependencies {
  fetch: typeof biwengerFetch;
  leagueId?: string;
}

export const defaultBoardDependencies: BoardDependencies = {
  fetch: biwengerFetch,
  leagueId: CONFIG.API.LEAGUE_ID,
};

export interface BiwengerBoardSyncResult {
  summary: string;
  counts: {
    transfers: number;
    pools: number;
    finances: number;
  };
}

interface TransferProcessingContext {
  playersList: Record<string, any>;
  teamNames: Set<string>;
  validUserNames: Set<string>;
  mutations: MarketMutations;
  onMissingPlayer: () => void;
  onSkippedActor: () => void;
}

async function processRoundBonus(
  content: any,
  date: string,
  mutations: MarketMutations
): Promise<number> {
  if (!content.results || !Array.isArray(content.results)) return 0;
  const roundId = content.round ? content.round.id : null;
  const roundName = content.round ? content.round.name : 'Unknown';
  let finances = 0;

  for (const res of content.results) {
    if (res.bonus && res.bonus > 0) {
      finances += Number(
        await mutations.insertFinance({
          user_id: res.user.id || res.user,
          round_id: roundId,
          date,
          type: 'round_bonus',
          amount: res.bonus,
          description: `Bonus ${roundName}`,
        })
      );
    }
  }
  return finances;
}

async function processAdminBonus(
  content: any,
  date: string,
  mutations: MarketMutations
): Promise<number> {
  if (content.to && content.amount) {
    return Number(
      await mutations.insertFinance({
        user_id: content.to.id || content.to,
        round_id: null,
        date,
        type: 'admin_bonus',
        amount: content.amount,
        description: content.text || 'Abono Administración',
      })
    );
  }
  return 0;
}

async function processLoanFees(
  content: any,
  date: string,
  mutations: MarketMutations
): Promise<number> {
  if (!Array.isArray(content)) throw new Error(`Invalid loan board content at ${date}`);
  let finances = 0;

  for (const loan of content) {
    if (loan?.amount === 0) continue;
    if (
      !Number.isSafeInteger(loan?.amount) ||
      loan.amount <= 0 ||
      !Number.isSafeInteger(loan.player) ||
      loan.player <= 0 ||
      !Number.isSafeInteger(loan.from?.id) ||
      loan.from.id <= 0 ||
      !Number.isSafeInteger(loan.to?.id) ||
      loan.to.id <= 0 ||
      loan.from.id === loan.to.id
    )
      throw new Error(`Invalid loan fee at ${date} for player ${loan?.player ?? 'unknown'}`);

    const fee = Number(loan.amount);
    const lenderId = String(loan.from.id);
    const borrowerId = String(loan.to.id);
    for (const [userId, amount] of [
      [lenderId, fee],
      [borrowerId, -fee],
    ] as const) {
      finances += Number(
        await mutations.insertFinance({
          user_id: userId,
          round_id: null,
          date,
          type: 'loan_fee',
          amount,
          description: `Loan fee for player #${loan.player}`,
        })
      );
    }
  }

  return finances;
}

async function processBettingPool(
  content: any,
  manager: SyncManager,
  mutations: MarketMutations
): Promise<number> {
  const pool = content.pool;
  if (!pool?.responses || !Array.isArray(pool.responses)) return 0;
  const sourceRound = pool.round;
  if (!sourceRound?.id) return 0;
  const roundId = manager.resolveRoundId(sourceRound);
  const roundName = sourceRound.name || 'Unknown Round';
  let pools = 0;

  for (const response of pool.responses) {
    const userId = response.id;
    if (!userId) continue;
    let prediction = response.response || response.result || '';
    if (Array.isArray(prediction)) prediction = prediction.join('-');
    await mutations.insertPorra({
      user_id: String(userId),
      round_id: roundId,
      round_name: roundName,
      result: String(prediction),
      aciertos: response.hits ?? response.points ?? null,
    });
    pools++;
  }
  return pools;
}

async function processTransfers(
  contentList: any[],
  timestamp: number,
  date: string,
  ctx: TransferProcessingContext
): Promise<number> {
  let transfers = 0;

  for (const content of contentList) {
    const playerId = content.player;
    const hasResolvedPlayer = Boolean(ctx.playersList[playerId]);

    let fromName = 'Mercado';
    let toName = 'Mercado';
    if (content.from) fromName = content.from.name;
    if (content.to) toName = content.to.name;

    // FILTER 1: Skip Mercado -> Mercado
    if (fromName === 'Mercado' && toName === 'Mercado') continue;

    // FILTER 2: Skip Real Teams
    if (ctx.teamNames.has(fromName) || ctx.teamNames.has(toName)) continue;

    // FILTER 3: Keep only user/market interactions
    const fromIsAllowed = fromName === 'Mercado' || ctx.validUserNames.has(fromName);
    const toIsAllowed = toName === 'Mercado' || ctx.validUserNames.has(toName);
    if (!fromIsAllowed || !toIsAllowed) {
      ctx.onSkippedActor();
      continue;
    }

    if (!hasResolvedPlayer) {
      ctx.onMissingPlayer();
    }

    const result = await ctx.mutations.insertTransfer({
      timestamp,
      fecha: date,
      player_id: playerId,
      precio: content.amount || 0,
      vendedor: fromName,
      comprador: toName,
    });

    if (result.created && result.id && content.bids && Array.isArray(content.bids)) {
      const transferId = result.id;
      for (const bid of content.bids) {
        try {
          const bidderId = bid.user ? bid.user.id || bid.user : null;
          const bidderName = bid.user ? bid.user.name || 'Unknown' : 'Unknown';

          await ctx.mutations.insertBid({
            transfer_id: transferId,
            bidder_id: bidderId ? bidderId.toString() : null,
            bidder_name: bidderName,
            amount: bid.amount || 0,
          });
        } catch {
          // Ignore bid errors
        }
      }
    }

    transfers++;
  }

  return transfers;
}

export async function syncBiwengerBoard(
  manager: SyncManager,
  dependencies: BoardDependencies = defaultBoardDependencies
): Promise<BiwengerBoardSyncResult> {
  const db = manager.context.db;
  const seasonId = manager.context.seasonId;
  if (!seasonId) throw new Error('Canonical sync season was not resolved before board ingestion.');
  const startsAt = await getSeasonStartDate(seasonId, db);
  const seasonStart = startsAt ? Date.parse(`${startsAt}T00:00:00Z`) : NaN;
  if (!Number.isFinite(seasonStart)) {
    throw new Error('Board history requires a valid canonical season start date.');
  }
  const cutoffDate = new Date(
    Math.max(
      seasonStart,
      manager.mode === 'routine' ? Date.now() - 7 * 24 * 60 * 60 * 1000 : seasonStart
    )
  );
  const snapshot = await manager.getBiwengerCompetition();
  const playersList = snapshot.players;
  const teams = snapshot.teams;

  const mutations = prepareMarketMutations(db as any, { seasonId });
  const validUserNames = await getSeasonActiveUserNames(seasonId, db);

  manager.log('Fetching full board history');
  let offset = 0;
  const limit = 50;
  let moreTransfers = true;
  let totalTransfers = 0;
  let totalPorras = 0;
  let totalFinances = 0;
  let transfersWithMissingPlayer = 0;
  let skippedInvalidActorTransfers = 0;
  const teamNames = new Set(Object.values(teams).map((team: any) => team.name));

  const leagueId = dependencies.leagueId ?? CONFIG.API.LEAGUE_ID;
  if (!leagueId) {
    throw new Error('BIWENGER_LEAGUE_ID is not defined in .env');
  }

  const transferCtx: TransferProcessingContext = {
    playersList,
    teamNames,
    validUserNames,
    mutations,
    onMissingPlayer: () => {
      transfersWithMissingPlayer++;
    },
    onSkippedActor: () => {
      skippedInvalidActorTransfers++;
    },
  };

  while (moreTransfers) {
    manager.log(`Fetching batch (offset: ${offset})`);
    const response = await dependencies.fetch(
      CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, offset, limit),
      { skipVersionCheck: true }
    );
    const items = response.data;

    if (!items || items.length === 0) {
      moreTransfers = false;
      break;
    }

    let reachedCutoff = false;
    for (const t of items) {
      const itemDate = new Date(t.date * 1000);
      if (itemDate < cutoffDate) {
        reachedCutoff = true;
        break;
      }

      if (
        ![
          'transfer',
          'market',
          'playerMovements',
          'bettingPool',
          'roundFinished',
          'adminTransfer',
          'loan',
        ].includes(t.type)
      ) {
        continue;
      }

      if (!t.content && t.type !== 'loan') continue;

      if (t.type === 'roundFinished') {
        const date = new Date(t.date * 1000).toISOString();
        totalFinances += await processRoundBonus(t.content, date, mutations);
        continue;
      }

      if (t.type === 'adminTransfer') {
        const date = new Date(t.date * 1000).toISOString();
        totalFinances += await processAdminBonus(t.content, date, mutations);
        continue;
      }

      if (t.type === 'loan') {
        const date = new Date(t.date * 1000).toISOString();
        totalFinances += await processLoanFees(t.content, date, mutations);
        continue;
      }

      if (t.type === 'bettingPool') {
        totalPorras += await processBettingPool(t.content, manager, mutations);
        continue;
      }

      if (Array.isArray(t.content)) {
        const timestamp = t.date;
        const date = new Date(timestamp * 1000).toISOString();
        totalTransfers += await processTransfers(t.content, timestamp, date, transferCtx);
      }
    }

    if (reachedCutoff) {
      manager.log(`Reached board cutoff ${cutoffDate.toISOString()}; stopping history fetch`);
      moreTransfers = false;
    } else if (items.length < limit) {
      moreTransfers = false;
    } else {
      offset += limit;
    }
  }

  if (transfersWithMissingPlayer > 0) {
    (manager.warn || manager.log).call(
      manager,
      `Inserted ${transfersWithMissingPlayer} transfers with players missing from playersList`
    );
  }

  if (skippedInvalidActorTransfers > 0) {
    (manager.warn || manager.log).call(
      manager,
      `Skipped ${skippedInvalidActorTransfers} transfers involving actors outside users/market`
    );
  }

  return {
    summary: 'Biwenger board history synchronized in a single pagination pass.',
    counts: { transfers: totalTransfers, pools: totalPorras, finances: totalFinances },
  };
}
